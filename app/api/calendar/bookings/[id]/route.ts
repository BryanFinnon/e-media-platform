import { NextResponse } from "next/server";
import { getCurrentUser, createServerClient } from "@/lib/supabase/server";

const escapeIcs = (value: string) => value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
const stamp = (value: string | Date) => new Date(value).toISOString().replaceAll("-", "").replaceAll(":", "").replace(".000", "");

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); const database = await createServerClient(); if (!user || !database) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await context.params; const { data } = await database.from("bookings").select("id, starts_at, ends_at, status").eq("id", id).eq("client_id", user.id).single();
  if (!data || data.status !== "CONFIRMED") return new NextResponse("Not found", { status: 404 });
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//E-MEDIA//Bookings//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${data.id}@e-media`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(data.starts_at)}`, `DTEND:${stamp(data.ends_at)}`, `SUMMARY:${escapeIcs("E-MEDIA — Confirmed booking")}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
  return new NextResponse(ics, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="e-media-${data.id}.ics"`, "cache-control": "private, no-store" } });
}
