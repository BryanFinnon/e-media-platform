import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/server/stripe";

export async function POST(request: Request) {
  const stripe = getStripe(); const database = createServiceClient(); const signature = request.headers.get("stripe-signature");
  if (!stripe || !database || !env.STRIPE_WEBHOOK_SECRET || !signature) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  const raw = await request.text(); let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(raw, signature, env.STRIPE_WEBHOOK_SECRET); }
  catch { return NextResponse.json({ error: "Invalid signature" }, { status: 400 }); }
  const payloadHash = createHash("sha256").update(raw).digest("hex");
  const { error: eventError } = await database.from("stripe_events").insert({ id: event.id, event_type: event.type, livemode: event.livemode, payload_hash: payloadHash });
  if (eventError?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
  if (eventError) return NextResponse.json({ error: "Event could not be recorded" }, { status: 500 });
  try {
    if (["payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.canceled"].includes(event.type)) {
      const intent = event.data.object as Stripe.PaymentIntent;
      const status = event.type === "payment_intent.succeeded" ? "SUCCEEDED" : event.type === "payment_intent.payment_failed" ? "FAILED" : "CANCELLED";
      await database.from("payments").update({ status, updated_at: new Date().toISOString() }).eq("stripe_payment_intent_id", intent.id);
      if (status === "SUCCEEDED" && intent.metadata.booking_id) await database.from("bookings").update({ payment_status: "SUCCEEDED", status: "CONFIRMED", updated_at: new Date().toISOString() }).eq("id", intent.metadata.booking_id);
    }
    await database.from("stripe_events").update({ processed_at: new Date().toISOString() }).eq("id", event.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown processing error";
    await database.from("stripe_events").update({ processing_error: message }).eq("id", event.id);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
