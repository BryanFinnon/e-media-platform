import "server-only";
import { env } from "@/lib/env";
import { sendViaResend } from "@/lib/server/resend-adapter";

export type EmailKind = "BOOKING_REQUEST" | "BOOKING_CONFIRMED" | "BOOKING_CHANGED" | "BOOKING_CANCELLED" | "PAYMENT_CONFIRMED" | "PAYMENT_FAILED" | "QUOTE_READY" | "PROJECT_UPDATE" | "CHAT_NOTIFICATION" | "ACCOUNT_SUPPORT";
export type EmailInput = {
  to: string;
  kind: EmailKind;
  subject: string;
  preview: string;
  heading: string;
  paragraphs: string[];
  details?: Array<{ label: string; value: string }>;
  action?: { label: string; href: string };
  idempotencyKey: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderTransactionalEmailHtml({ preview, heading, paragraphs, details, action }: Pick<EmailInput, "preview" | "heading" | "paragraphs" | "details" | "action">) {
  const paragraphHtml = paragraphs
    .map((paragraph) => `<p style="color:#b0b0b0;line-height:1.65;white-space:pre-wrap">${escapeHtml(paragraph)}</p>`)
    .join("");
  const detailsHtml = details?.length
    ? `<div style="border-top:1px solid #343434;margin-top:32px">${details
        .map(
          (detail) =>
            `<div style="border-bottom:1px solid #343434;padding:14px 0"><div style="color:#777;font-size:11px;letter-spacing:1px;text-transform:uppercase">${escapeHtml(detail.label)}</div><div style="color:#f2f0eb;margin-top:6px">${escapeHtml(detail.value)}</div></div>`,
        )
        .join("")}</div>`
    : "";
  const actionHtml = action
    ? `<a href="${escapeHtml(action.href)}" style="background:#e34a26;color:#fff;display:inline-block;margin-top:28px;padding:14px 20px;text-decoration:none">${escapeHtml(action.label)} &rarr;</a>`
    : "";

  return `<!doctype html><html lang="en"><body style="background:#050505;color:#f2f0eb;font-family:Arial,sans-serif;margin:0;padding:40px 20px"><div style="display:none;max-height:0;opacity:0;overflow:hidden">${escapeHtml(preview)}</div><div style="margin:0 auto;max-width:620px"><div style="color:#e34a26;font-size:18px;font-weight:800;letter-spacing:1px">E-MEDIA</div><h1 style="font-size:36px;line-height:1.05;margin:40px 0 24px">${escapeHtml(heading)}</h1>${paragraphHtml}${detailsHtml}${actionHtml}<p style="border-top:1px solid #232323;color:#777;font-size:12px;margin-top:40px;padding-top:20px">London / UK &middot; Transactional message from E-MEDIA &middot; weareemedia.co.uk</p></div></body></html>`;
}

export async function sendTransactionalEmail(input: EmailInput) {
  if (process.env.NODE_ENV === "test") return { status: "skipped" as const, reason: "test_environment" };
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return { status: "skipped" as const, reason: "provider_not_configured" };

  return sendViaResend({
    apiKey: env.RESEND_API_KEY,
    from: `E-MEDIA <${env.EMAIL_FROM}>`,
    to: input.to,
    replyTo: env.EMAIL_REPLY_TO || env.EMAIL_FROM,
    subject: input.subject,
    html: renderTransactionalEmailHtml(input),
    idempotencyKey: input.idempotencyKey,
  });
}
