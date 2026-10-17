import {serveFile} from "@/lib/server/serve-file";
import { NextResponse } from "next/server";
import { getDatabase, requireAdministrator } from "@/lib/server/sites";

type Props = { params: Promise<{ id: string }> };
type Asset = { storage_key: string; mime_type: string; visibility: string; filename: string; size_bytes:number };

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const database = await getDatabase();
  const asset = await database
    .prepare("SELECT storage_key, mime_type, visibility, filename, size_bytes FROM media_assets WHERE id = ?")
    .bind(id)
    .first<Asset>();
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (asset.visibility !== "PUBLIC") {
    const access = await requireAdministrator(request);
    if (access.status !== 200) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return serveFile(request,asset.storage_key,asset.mime_type,asset.size_bytes,undefined,asset.visibility === "PUBLIC");
}
