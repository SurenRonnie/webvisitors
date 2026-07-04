import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';

const KEY_PREFIX = 'enrichment:ip:';

// Caches IP->company resolution in Redis so repeat visits/sessions from the same
// company (very common — same office IP) don't burn a paid enrichment API call each time.
export async function getCachedResolution(ip) {
  const raw = await getRedis().get(KEY_PREFIX + ip);
  return raw ? JSON.parse(raw) : null;
}

export async function setCachedResolution(ip, resolution) {
  await getRedis().set(KEY_PREFIX + ip, JSON.stringify(resolution), 'EX', env.enrichmentCacheTtlSeconds);
}
