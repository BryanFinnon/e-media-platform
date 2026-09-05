import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

const remoteLimiter = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Ratelimit({
      redis: new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN }),
      limiter: Ratelimit.slidingWindow(8, "1 m"),
      prefix: "emedia",
    })
  : null;

const developmentHits = new Map<string, { count: number; resetsAt: number }>();

export async function limitSensitiveAction(key: string) {
  if (remoteLimiter) return remoteLimiter.limit(key);
  if (process.env.NODE_ENV === "production") return { success: false, limit: 0, remaining: 0, reset: Date.now() };

  const now = Date.now();
  const previous = developmentHits.get(key);
  const current = !previous || previous.resetsAt < now
    ? { count: 1, resetsAt: now + 60_000 }
    : { count: previous.count + 1, resetsAt: previous.resetsAt };
  developmentHits.set(key, current);
  return { success: current.count <= 8, limit: 8, remaining: Math.max(0, 8 - current.count), reset: current.resetsAt };
}
