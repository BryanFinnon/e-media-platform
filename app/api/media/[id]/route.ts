import { NextResponse } from "next/server";
import { getDatabase, getFileStorage, requireAdministrator } from "@/lib/server/sites";

type Props = { params: Promise<{ id: string }> };
type Asset = { storage_key: string; mime_type: string; visibility: string; filename: string };

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const database = await getDatabase();
  const asset = await database
    .prepare("SELECT storage_key, mime_type, visibility, filename FROM media_assets WHERE id = ?")
    .bind(id)
    .first<Asset>();
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (asset.visibility !== "PUBLIC") {
    const access = await requireAdministrator(request);
    if (access.status !== 200) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const object = await (await getFileStorage()).get(asset.storage_key);
  if (!object) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new Response(object.body as BodyInit, {
    headers: {
      "content-type": object.httpMetadata?.contentType || asset.mime_type,
      "cache-control": asset.visibility === "PUBLIC" ? "public, max-age=31536000, immutable" : "private, no-store",
      ...(object.httpEtag ? { etag: object.httpEtag } : {}),
      "x-content-type-options": "nosniff",
    },
  });
}
