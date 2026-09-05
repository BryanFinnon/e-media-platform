import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";

export type D1Result<T = unknown> = {
  results?: T[];
  success: boolean;
  meta?: { changes?: number };
};

export type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  first: <T = Record<string, unknown>>(column?: string) => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<D1Result<T>>;
  run: () => Promise<D1Result>;
};

export type D1Database = {
  prepare: (query: string) => D1Statement;
  batch: (statements: D1Statement[]) => Promise<D1Result[]>;
};

type R2ObjectBody = {
  body: ReadableStream<Uint8Array>;
  httpEtag?: string;
  httpMetadata?: { contentType?: string; cacheControl?: string };
};

export type R2Bucket = {
  get: (key: string) => Promise<R2ObjectBody | null>;
  put: (
    key: string,
    value: ArrayBuffer | ReadableStream<Uint8Array>,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string };
      customMetadata?: Record<string, string>;
    },
  ) => Promise<unknown>;
  delete: (key: string) => Promise<void>;
};

type SitesEnv = {
  DB?: D1Database;
  FILES?: R2Bucket;
  ADMIN_EMAILS?: string;
  [key: string]: unknown;
};

export type SitesIdentity = { email: string; fullName: string | null };

async function getSitesEnv(): Promise<SitesEnv> {
  const context = await getCloudflareContext({ async: true });
  return context.env as unknown as SitesEnv;
}

export async function getDatabase(): Promise<D1Database> {
  const database = (await getSitesEnv()).DB;
  if (!database) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  return database;
}

export async function getFileStorage(): Promise<R2Bucket> {
  const bucket = (await getSitesEnv()).FILES;
  if (!bucket) throw new Error("Cloudflare R2 binding `FILES` is unavailable.");
  return bucket;
}

export function identityFromHeaders(requestHeaders: Headers): SitesIdentity | null {
  const email = requestHeaders.get("oai-authenticated-user-email")?.trim().toLowerCase();
  if (!email) return null;
  const fullName = requestHeaders.get("oai-authenticated-user-full-name")?.trim() || null;
  return { email, fullName };
}

export async function getCurrentIdentity(): Promise<SitesIdentity | null> {
  return identityFromHeaders(await headers());
}

async function getAdminEmails(): Promise<Set<string>> {
  let configured = process.env.ADMIN_EMAILS ?? "";
  try {
    configured = String((await getSitesEnv()).ADMIN_EMAILS ?? configured);
  } catch {
    // Local Next.js development can run without Cloudflare bindings.
  }
  return new Set(
    configured
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function isAdministrator(identity: SitesIdentity | null) {
  if (!identity) return false;
  return (await getAdminEmails()).has(identity.email);
}

export async function requireAdministrator(request: Request) {
  const identity = identityFromHeaders(request.headers);
  if (!identity) return { identity: null, status: 401 as const };
  if (!(await isAdministrator(identity))) return { identity, status: 403 as const };
  return { identity, status: 200 as const };
}

export async function checkDatabaseRateLimit(
  database: D1Database,
  key: string,
  limit = 8,
  windowSeconds = 60,
) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const windowStart = Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds;
  await database
    .prepare(
      `INSERT INTO rate_limits (key_hash, window_start, hit_count)
       VALUES (?, ?, 1)
       ON CONFLICT (key_hash, window_start)
       DO UPDATE SET hit_count = hit_count + 1`,
    )
    .bind(hash, windowStart)
    .run();
  const row = await database
    .prepare("SELECT hit_count FROM rate_limits WHERE key_hash = ? AND window_start = ?")
    .bind(hash, windowStart)
    .first<{ hit_count: number }>();
  return { success: Number(row?.hit_count ?? limit + 1) <= limit };
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function createBookingReference() {
  const date = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `EM-${date}-${suffix}`;
}
