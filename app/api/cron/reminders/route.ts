import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, processed: 0, note: "Reminder delivery requires configured email templates and eligible confirmed bookings." });
}
