import { z } from "zod";

type ResendRequest = {
  apiKey: string;
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  idempotencyKey: string;
};

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const acceptedResponseSchema = z.object({ id: z.string().min(1) });

export async function sendViaResend(input: ResendRequest, fetcher: Fetcher = fetch) {
  try {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        reply_to: input.replyTo,
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!response.ok) {
      return { status: "failed" as const, reason: `provider_rejected_${response.status}` };
    }

    const body: unknown = await response.json().catch(() => null);
    const parsed = acceptedResponseSchema.safeParse(body);
    if (!parsed.success) return { status: "failed" as const, reason: "provider_invalid_response" };
    return { status: "sent" as const, id: parsed.data.id };
  } catch {
    return { status: "failed" as const, reason: "provider_unavailable" };
  }
}
