import { NextResponse } from "next/server";
import { detectImageType, supportedImageTypes } from "@/lib/domain/image-upload";
import { createId, getDatabase, getFileStorage, requireAdministrator } from "@/lib/server/sites";

const maxBytes = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const access = await requireAdministrator(request);
  if (access.status !== 200 || !access.identity) {
    return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Forbidden" }, { status: access.status });
  }
  const form = await request.formData();
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const altText = String(form.get("altText") ?? "").trim();
  if (!(file instanceof File) || file.size <= 0 || file.size > maxBytes) {
    return NextResponse.json({ error: "Use a JPEG, PNG, WebP or GIF image up to 10 MB" }, { status: 400 });
  }
  if (title.length < 2 || title.length > 120 || altText.length < 2 || altText.length > 240) {
    return NextResponse.json({ error: "Title or alternative text is invalid" }, { status: 400 });
  }

  const contents = await file.arrayBuffer();
  const detectedType = detectImageType(new Uint8Array(contents));
  if (!detectedType || detectedType !== file.type) {
    return NextResponse.json({ error: "The file contents do not match a supported image format" }, { status: 400 });
  }

  const id = createId("media");
  const key = `public/${id}.${supportedImageTypes[detectedType]}`;
  const database = await getDatabase();
  const bucket = await getFileStorage();
  await bucket.put(key, contents, {
    httpMetadata: { contentType: detectedType, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { uploadedBy: access.identity.email },
  });
  try {
    const now = new Date().toISOString();
    await database.batch([
      database
        .prepare(
          `INSERT INTO media_assets
           (id, storage_key, filename, title, alt_text, mime_type, size_bytes, visibility, created_by_email, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'PUBLIC', ?, ?)`,
        )
        .bind(id, key, file.name.slice(0, 240), title, altText, detectedType, file.size, access.identity.email, now),
      database
        .prepare(
          `INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id, metadata_json, created_at)
           VALUES (?, ?, 'media.uploaded', 'media_asset', ?, ?, ?)`,
        )
        .bind(createId("audit"), access.identity.email, id, JSON.stringify({ filename: file.name, size: file.size }), now),
    ]);
  } catch (error) {
    await bucket.delete(key);
    throw error;
  }
  return NextResponse.redirect(new URL("/admin/media", request.url), 303);
}
