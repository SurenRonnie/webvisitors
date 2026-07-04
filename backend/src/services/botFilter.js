const BOT_UA_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /slurp/i,
  /bingpreview/i,
  /headlesschrome/i,
  /python-requests/i,
  /curl\//i,
  /wget/i,
  /facebookexternalhit/i,
];

// Known SaaS/proxy hosting providers whose traffic shouldn't be surfaced as a "company visit" —
// this list is intentionally short; the IP-to-company provider's business/isp/hosting
// classification is the primary filter, this is a fast pre-check before we even call it.
const KNOWN_PROXY_ASN_KEYWORDS = ['amazon', 'google cloud', 'microsoft azure', 'digitalocean', 'ovh', 'hetzner', 'cloudflare'];

export function isBotUserAgent(userAgent = '') {
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function isLikelyProxyOrg(orgName = '') {
  const lower = orgName.toLowerCase();
  return KNOWN_PROXY_ASN_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function shouldFilterHit({ userAgent, isPrivate }) {
  if (isPrivate) return true;
  if (isBotUserAgent(userAgent)) return true;
  return false;
}
