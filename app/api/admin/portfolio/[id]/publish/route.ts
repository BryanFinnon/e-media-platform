import { NextResponse } from "next/server";
import { z } from "zod";
import { createId, getDatabase, requireAdministrator } from "@/lib/server/sites";

type Props = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Props) {
  const access = await requireAdministrator(request);
  if (access.status !== 200 || !access.identity) {
    return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Forbidden" }, { status: access.status });
  }
  const published = z.enum(["0", "1"]).safeParse((await request.formData()).get("published"));
  if (!published.success) return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  const { id } = await params;
  const now = new Date().toISOString();
  const database = await getDatabase();
  await database.batch([
    database.prepare("UPDATE portfolio_items SET published = ?, updated_at = ? WHERE id = ?").bind(Number(published.data), now, id),
    database
      .prepare(
        `INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id, metadata_json, created_at)
         VALUES (?, ?, 'portfolio.publication_changed', 'portfolio_item', ?, ?, ?)`,
      )
      .bind(createId("audit"), access.identity.email, id, JSON.stringify({ published: published.data === "1" }), now),
  ]);
  return NextResponse.redirect(new URL("/admin/portfolio", request.url), 303);
}
