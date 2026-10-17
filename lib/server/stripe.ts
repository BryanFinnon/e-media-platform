import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

export function getStripe() {
  return env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-08-26.dahlia" as Stripe.LatestApiVersion,
    // Workers use fetch rather than the SDK's default Node HTTP transport.
    httpClient: Stripe.createFetchHttpClient(),
    timeout: 20000,
    maxNetworkRetries: 1,
  }) : null;
}
