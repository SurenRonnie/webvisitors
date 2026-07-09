// Shared "is this AS name a residential ISP / cloud-hosting provider (not a real
// business visitor)" heuristic, used by every IP-to-company provider that resolves
// down to an ASN organization name (ipinfo's /lite endpoint, Team Cymru WHOIS, ...).
const RESIDENTIAL_ISP_KEYWORDS = [
  'comcast', 'xfinity', 'spectrum', 'charter', 'cox communications', 'at&t', 'verizon',
  't-mobile', 'sprint', 'vodafone', 'telstra', 'bt group', 'british telecom', 'deutsche telekom',
  'orange s.a', 'telefonica', 'virgin media', 'sky broadband', 'centurylink', 'frontier communications',
  'optimum', 'altice', 'rogers communications', 'bell canada', 'telus', 'jio', 'airtel', 'reliance',
];

const HOSTING_PROXY_KEYWORDS = [
  'amazon', 'google cloud', 'microsoft azure', 'digitalocean', 'ovh', 'hetzner', 'cloudflare', 'linode', 'vultr',
];

export function looksResidentialOrHosting(asName = '') {
  const lower = asName.toLowerCase();
  return [...RESIDENTIAL_ISP_KEYWORDS, ...HOSTING_PROXY_KEYWORDS].some((keyword) => lower.includes(keyword));
}
