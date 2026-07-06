import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';

const KEY_PREFIX = 'enrichment:ip:';
const COMPANY_KEY_PREFIX = 'enrichment:company:';

// Caches IP->company resolution in Redis so repeat visits/sessions from the same
// company (very common — same office IP) don't burn a paid enrichment API call each time.
export async function getCachedResolution(ip) {
  const raw = await getRedis().get(KEY_PREFIX + ip);
  return raw ? JSON.parse(raw) : null;
}

export async function setCachedResolution(ip, resolution) {
  await getRedis().set(KEY_PREFIX + ip, JSON.stringify(resolution), 'EX', env.enrichmentCacheTtlSeconds);
}

// Caches domain->company-enrichment (socials/industry/tech stack) so the same
// company's homepage isn't re-scraped on every visit within the TTL window.
export async function getCachedCompanyEnrichment(domain) {
  const raw = await getRedis().get(COMPANY_KEY_PREFIX + domain);
  return raw ? JSON.parse(raw) : null;
}

export async function setCachedCompanyEnrichment(domain, enrichment) {
  await getRedis().set(COMPANY_KEY_PREFIX + domain, JSON.stringify(enrichment ?? {}), 'EX', env.enrichmentCacheTtlSeconds);
}
