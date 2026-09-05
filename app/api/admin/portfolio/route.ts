import { NextResponse } from "next/server";
import { z } from "zod";
import { createId, getDatabase, requireAdministrator } from "@/lib/server/sites";

const inputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  yearLabel: z.string().trim().min(2).max(40),
  summary: z.string().trim().min(10).max(600),
  coverMediaId: z.string().max(80).optional(),
  published: z.boolean(),
});

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "project";
}

export async function POST(request: Request) {
  const access = await requireAdministrator(request);
  if (access.status !== 200 || !access.identity) {
    return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Forbidden" }, { status: access.status });
  }
  const form = await request.formData();
  const parsed = inputSchema.safeParse({
    title: form.get("title"),
    category: form.get("category"),
    yearLabel: form.get("yearLabel"),
    summary: form.get("summary"),
    coverMediaId: String(form.get("coverMediaId") ?? "") || undefined,
    published: form.get("published") === "on",
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid portfolio project" }, { status: 400 });

  const id = createId("work");
  const slug = `${slugify(parsed.data.title)}-${id.slice(-6)}`;
  const now = new Date().toISOString();
  const database = await getDatabase();
  await database.batch([
    database
      .prepare(
        `INSERT INTO portfolio_items
         (id, slug, title, category, year_label, summary, cover_media_id, published, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, slug, parsed.data.title, parsed.data.category, parsed.data.yearLabel, parsed.data.summary, parsed.data.coverMediaId ?? null, parsed.data.published ? 1 : 0, now, now),
    database
      .prepare(
        `INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id, metadata_json, created_at)
         VALUES (?, ?, 'portfolio.created', 'portfolio_item', ?, ?, ?)`,
      )
      .bind(createId("audit"), access.identity.email, id, JSON.stringify({ slug, published: parsed.data.published }), now),
  ]);
  return NextResponse.redirect(new URL("/admin/portfolio", request.url), 303);
}
