import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/server/stripe";
import { limitSensitiveAction } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body: unknown = await request.json().catch(() => null); const parsed = z.object({ bookingId: z.uuid() }).safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
  const limit = await limitSensitiveAction(`payment:${user.id}`); if (!limit.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const stripe = getStripe(); const database = createServiceClient(); if (!stripe || !database) return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  const { data: booking } = await database.from("bookings").select("id, client_id, deposit_minor, total_minor, currency, status").eq("id", parsed.data.bookingId).eq("client_id", user.id).single();
  if (!booking || !["PENDING", "AWAITING_PAYMENT", "REQUESTED"].includes(booking.status)) return NextResponse.json({ error: "Booking cannot be paid" }, { status: 409 });
  const amount = booking.deposit_minor > 0 ? booking.deposit_minor : booking.total_minor; if (amount <= 0) return NextResponse.json({ error: "No payment is due" }, { status: 409 });
  const intent = await stripe.paymentIntents.create({ amount, currency: booking.currency.toLowerCase(), automatic_payment_methods: { enabled: true }, metadata: { booking_id: booking.id, client_id: user.id } }, { idempotencyKey: `booking:${booking.id}:amount:${amount}` });
  await database.from("payments").upsert({ booking_id: booking.id, customer_id: user.id, stripe_payment_intent_id: intent.id, amount_minor: amount, currency: booking.currency, status: "PENDING" }, { onConflict: "stripe_payment_intent_id" });
  return NextResponse.json({ clientSecret: intent.client_secret });
}
