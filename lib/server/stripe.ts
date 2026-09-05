import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

export function getStripe() {
  return env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
}
