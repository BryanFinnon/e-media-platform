import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyBookingConfirmed } from "@/lib/server/booking-notifications";
import { createId, getDatabase, requireAdministrator } from "@/lib/server/sites";

type Props = { params: Promise<{ id: string }> };
const statusSchema = z.enum(["NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"]);
type Booking = {
  id: string;
  reference: string;
  service_name: string;
  client_name: string;
  client_email: string;
  preferred_at: string;
  duration_minutes: number;
  timezone: "Europe/London";
  brief: string;
  client_confirmation_email_sent_at: string | null;
};

export async function POST(request: Request, { params }: Props) {
  const access = await requireAdministrator(request);
  if (access.status !== 200 || !access.identity) {
    return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Forbidden" }, { status: access.status });
  }
  const status = statusSchema.safeParse((await request.formData()).get("status"));
  if (!status.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await params;
  const database = await getDatabase();
  const booking = await database.prepare("SELECT * FROM bookings WHERE id = ?").bind(id).first<Booking>();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const now = new Date().toISOString();
  await database.batch([
    database.prepare("UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?").bind(status.data, now, id),
    database
      .prepare(
        `INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id, metadata_json, created_at)
         VALUES (?, ?, 'booking.status_changed', 'booking', ?, ?, ?)`,
      )
      .bind(createId("audit"), access.identity.email, id, JSON.stringify({ status: status.data }), now),
  ]);
  if (status.data === "CONFIRMED" && !booking.client_confirmation_email_sent_at) {
    await notifyBookingConfirmed({
      database,
      bookingId: booking.id,
      actorEmail: access.identity.email,
      booking: {
        reference: booking.reference,
        serviceName: booking.service_name,
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        preferredAt: booking.preferred_at,
        durationMinutes: booking.duration_minutes,
        timezone: booking.timezone,
        brief: booking.brief,
      },
    });
  }
  return NextResponse.redirect(new URL("/admin/bookings", request.url), 303);
}
