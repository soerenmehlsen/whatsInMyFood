import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const REQUESTS_PER_DAY = 15;

let ratelimit: Ratelimit | null = null;
let warned = false;

function getRatelimit(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warned) {
      console.warn(
        "[rate-limit] Upstash env vars missing; rate limiting disabled.",
      );
      warned = true;
    }
    return null;
  }
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(REQUESTS_PER_DAY, "24 h"),
      prefix: "parseIngredient",
    });
  }
  return ratelimit;
}

// Returns { success: true } when the request is allowed. Fails open: when
// Upstash is not configured (e.g. local dev) or the Upstash call itself errors
// (network/Redis down), requests are allowed rather than blocking real users.
export async function checkRateLimit(
  identifier: string,
): Promise<{ success: boolean }> {
  const rl = getRatelimit();
  if (!rl) {
    return { success: true };
  }
  try {
    const { success } = await rl.limit(identifier);
    return { success };
  } catch (err) {
    console.error("[rate-limit] Upstash error; allowing request.", err);
    return { success: true };
  }
}
