import { NextResponse } from "next/server";
import { z } from "zod";
import { checkDatabaseRateLimit, createId, getDatabase } from "@/lib/server/sites";

export async function POST(request: Request) {
  const form: unknown = await request.json().catch(() => null);
  const input = z
    .object({ email: z.email(), consent: z.literal(true), source: z.string().max(80).default("WEBSITE") })
    .safeParse(form);
  if (!input.success) {
    return NextResponse.json({ error: "Explicit consent and a valid email are required" }, { status: 400 });
  }

  try {
    const database = await getDatabase();
    const email = input.data.email.toLowerCase();
    const limit = await checkDatabaseRateLimit(database, `newsletter:${email}`, 4, 300);
    if (!limit.success) return NextResponse.json({ error: "Try again later" }, { status: 429 });
    const now = new Date().toISOString();
    await database
      .prepare(
        `INSERT INTO newsletter_subscribers (id, email, status, source, consent_at, created_at, updated_at)
         VALUES (?, ?, 'SUBSCRIBED', ?, ?, ?, ?)
         ON CONFLICT (email) DO UPDATE SET status = 'SUBSCRIBED', source = excluded.source, consent_at = excluded.consent_at, updated_at = excluded.updated_at`,
      )
      .bind(createId("sub"), email, input.data.source, now, now, now)
      .run();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Newsletter persistence failed", error);
    return NextResponse.json({ error: "Subscription failed" }, { status: 503 });
  }
}
