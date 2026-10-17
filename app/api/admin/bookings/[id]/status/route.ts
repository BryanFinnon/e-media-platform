import { NextResponse } from "next/server";
import { z } from "zod";
import {sameOrigin} from "@/lib/server/projects";
import { createId, getDatabase, requireAdministrator } from "@/lib/server/sites";

type Props = { params: Promise<{ id: string }> };
const statusSchema = z.enum(["NEW", "CONTACTED", "CANCELLED"]);
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
  if(!sameOrigin(request)) return NextResponse.json({error:"Invalid origin"},{status:403});
  const status = statusSchema.safeParse((await request.formData()).get("status"));
  if (!status.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await params;
  const database = await getDatabase();
  const booking = await database.prepare("SELECT * FROM bookings WHERE id = ?").bind(id).first<Booking>();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const quote=await database.prepare("SELECT booking_id FROM booking_quotes WHERE booking_id=?").bind(id).first();
  if(quote && status.data!=="CANCELLED") return NextResponse.json({error:"Published quotes are managed through payment and gallery actions."},{status:409});
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
  return NextResponse.redirect(new URL("/admin/bookings", request.url), 303);
}
