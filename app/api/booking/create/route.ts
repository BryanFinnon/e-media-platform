import { rates } from '@/lib/domain/quotes';
import { sameOrigin } from '@/lib/server/projects';
import { NextResponse } from "next/server";
import {
  bookingRequestSchema,
  bookingRequestValidationMessage,
} from "@/lib/domain/booking-request";
import { zonedLocalToUtc } from "@/lib/domain/timezone";
import { notifyBookingCreated } from "@/lib/server/booking-notifications";
import {
  checkDatabaseRateLimit,
  createBookingReference,
  createId,
  getDatabase,
  getCurrentIdentity,
} from "@/lib/server/sites";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error: 'Invalid origin'}, {status:403});
  const identity = await getCurrentIdentity();
  if (!identity) return NextResponse.json({error:'Please sign in before submitting a project request.'},{status:401});
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const body: unknown = await request.json().catch(() => null);
  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: bookingRequestValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const database = await getDatabase();
    const limit = await checkDatabaseRateLimit(database, `booking:${forwarded}`);
    if (!limit.success) return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });

    const service = await database
      .prepare("SELECT slug, name FROM services WHERE slug = ? AND active = 1")
      .bind(parsed.data.serviceSlug)
      .first<{ slug: string; name: string }>();
    if (!service) return NextResponse.json({ error: "The selected service is currently unavailable." }, { status: 404 });

    const rate = parsed.data.rateId ? rates.find(r=>r.id===parsed.data.rateId && r.serviceSlug===parsed.data.serviceSlug) : null;
    if (parsed.data.rateId && !rate) return NextResponse.json({error:'Choose a valid package'}, {status:400});
    if (rate && parsed.data.quantity < rate.minimumQuantity) return NextResponse.json({error:`Minimum quantity: ${rate.minimumQuantity}`},{status:400});
    parsed.data.email = identity.email;
    const id = createId("book");
    const reference = createBookingReference();
    const now = new Date().toISOString();
    const requestedStart = zonedLocalToUtc(parsed.data.date, parsed.data.time, parsed.data.timezone);
    await database.batch([
      database
        .prepare(
          `INSERT INTO bookings
           (id, reference, service_slug, service_name, preferred_at, duration_minutes, timezone, client_name, client_email, brief, status, source, consent_at, created_at, updated_at, rate_id, quantity, client_account_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', 'WEBSITE', ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          reference,
          service.slug,
          service.name,
          requestedStart.toISOString(),
          parsed.data.durationMinutes,
          parsed.data.timezone,
          parsed.data.name,
          parsed.data.email.toLowerCase(),
          parsed.data.brief,
          now,
          now,
          now,
          rate?.id ?? null,
          parsed.data.quantity,
          identity.accountId ?? null,
        ),
      database
        .prepare(
          `INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id, metadata_json, created_at)
           VALUES (?, ?, 'booking.created', 'booking', ?, ?, ?)`,
        )
        .bind(createId("audit"), parsed.data.email.toLowerCase(), id, JSON.stringify({ reference, durationMinutes: parsed.data.durationMinutes }), now),
    ]);
    await notifyBookingCreated({
      database,
      bookingId: id,
      actorEmail: parsed.data.email.toLowerCase(),
      booking: {
        reference,
        serviceName: service.name,
        clientName: parsed.data.name,
        clientEmail: parsed.data.email.toLowerCase(),
        preferredAt: requestedStart.toISOString(),
        durationMinutes: parsed.data.durationMinutes,
        timezone: parsed.data.timezone,
        brief: parsed.data.brief,
      },
    });
    return NextResponse.json({ status: "REQUESTED", reference }, { status: 201 });
  } catch (error) {
    console.error("Booking persistence failed", error);
    return NextResponse.json({ error: "Request could not be saved" }, { status: 503 });
  }
}
