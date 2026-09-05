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
} from "@/lib/server/sites";

export async function POST(request: Request) {
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

    const id = createId("book");
    const reference = createBookingReference();
    const now = new Date().toISOString();
    const requestedStart = zonedLocalToUtc(parsed.data.date, parsed.data.time, parsed.data.timezone);
    await database.batch([
      database
        .prepare(
          `INSERT INTO bookings
           (id, reference, service_slug, service_name, preferred_at, duration_minutes, timezone, client_name, client_email, brief, status, source, consent_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', 'WEBSITE', ?, ?, ?)`,
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
