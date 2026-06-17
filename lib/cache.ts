// Barcode-keyed cache for parsed ingredient results. A given barcode + target
// language always yields the same Gemini output, so popular products are parsed
// once and served from Redis afterwards. Fail-open like the rate limiter: if
// Upstash is missing or errors, we just skip the cache and parse normally.

import { Redis } from "@upstash/redis";

const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

let redis: Redis | null = null;
let warned = false;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warned) {
      console.warn("[cache] Upstash env vars missing; parse cache disabled.");
      warned = true;
    }
    return null;
  }
  if (!redis) redis = new Redis({ url, token });
  return redis;
}

export interface CachedParse {
  ingredient: unknown[];
  language: string;
}

export async function getCachedParse(key: string): Promise<CachedParse | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return (await r.get<CachedParse>(`parse:${key}`)) ?? null;
  } catch (err) {
    console.error("[cache] read error; skipping cache.", err);
    return null;
  }
}

export async function setCachedParse(
  key: string,
  value: CachedParse,
): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(`parse:${key}`, value, { ex: TTL_SECONDS });
  } catch (err) {
    console.error("[cache] write error; ignoring.", err);
  }
}
