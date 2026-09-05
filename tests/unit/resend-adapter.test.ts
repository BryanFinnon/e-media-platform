import { describe, expect, it, vi } from "vitest";
import { sendViaResend } from "@/lib/server/resend-adapter";

const input = {
  apiKey: "re_development_test_key",
  from: "E-MEDIA <contact@weareemedia.co.uk>",
  to: "client@example.com",
  replyTo: "contact@weareemedia.co.uk",
  subject: "Booking received",
  html: "<p>Booking received.</p>",
  idempotencyKey: "booking-request-client/book_test",
};

describe("Resend adapter", () => {
  it("uses the Worker-compatible HTTP API and returns the provider message ID", async () => {
    const fetcher = vi.fn(async () => Response.json({ id: "email_test_123" }));

    const result = await sendViaResend(input, fetcher);

    expect(result).toEqual({ status: "sent", id: "email_test_123" });
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, request] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(request?.headers).toMatchObject({
      Authorization: "Bearer re_development_test_key",
      "Idempotency-Key": "booking-request-client/book_test",
    });
    expect(JSON.parse(String(request?.body))).toMatchObject({
      from: input.from,
      to: [input.to],
      reply_to: input.replyTo,
      subject: input.subject,
      html: input.html,
    });
  });

  it("records the provider status without exposing the response body", async () => {
    const fetcher = vi.fn(async () => new Response("rejected", { status: 422 }));

    await expect(sendViaResend(input, fetcher)).resolves.toEqual({
      status: "failed",
      reason: "provider_rejected_422",
    });
  });

  it("reports network failures as provider unavailable", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("network details must not be logged");
    });

    await expect(sendViaResend(input, fetcher)).resolves.toEqual({
      status: "failed",
      reason: "provider_unavailable",
    });
  });
});
