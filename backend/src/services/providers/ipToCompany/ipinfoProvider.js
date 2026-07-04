import { IpToCompanyProvider } from './IpToCompanyProvider.js';
import { env } from '../../../config/env.js';

// The standard ipinfo.io/<ip> endpoint only includes `company.{domain,name,type}`
// as a paid "Business Data" add-on — a free-tier token gets `org` as a plain string
// (e.g. "AS15169 Google LLC") with no domain at all. IPinfo's newer `/lite` endpoint
// is free-tier and includes `as_domain`/`as_name`, which is what we actually need,
// so we use that instead and approximate "is this a business" via ASN name keywords
// (the /lite tier has no residential/business classification field).
const LITE_ENDPOINT = 'https://api.ipinfo.io/lite';

const RESIDENTIAL_ISP_KEYWORDS = [
  'comcast', 'xfinity', 'spectrum', 'charter', 'cox communications', 'at&t', 'verizon',
  't-mobile', 'sprint', 'vodafone', 'telstra', 'bt group', 'british telecom', 'deutsche telekom',
  'orange s.a', 'telefonica', 'virgin media', 'sky broadband', 'centurylink', 'frontier communications',
  'optimum', 'altice', 'rogers communications', 'bell canada', 'telus', 'jio', 'airtel', 'reliance',
];

const HOSTING_PROXY_KEYWORDS = [
  'amazon', 'google cloud', 'microsoft azure', 'digitalocean', 'ovh', 'hetzner', 'cloudflare', 'linode', 'vultr',
];

function looksResidentialOrHosting(asName = '') {
  const lower = asName.toLowerCase();
  return [...RESIDENTIAL_ISP_KEYWORDS, ...HOSTING_PROXY_KEYWORDS].some((keyword) => lower.includes(keyword));
}

export class IpinfoProvider extends IpToCompanyProvider {
  async resolve(ip) {
    const url = `${LITE_ENDPOINT}/${ip}?token=${env.ipinfoApiToken}`;
    console.log('[ipinfo] request', { ip, tokenSet: Boolean(env.ipinfoApiToken) });

    const res = await fetch(url);
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      console.error('[ipinfo] request failed', { ip, status: res.status, body: bodyText });
      throw new Error(`IPinfo lookup failed with status ${res.status}`);
    }
    const data = await res.json();
    console.log('[ipinfo] raw response', { ip, data });

    if (!data.as_domain || !data.as_name) {
      console.log('[ipinfo] no ASN org/domain in response, unresolvable', { ip });
      return null;
    }

    if (looksResidentialOrHosting(data.as_name)) {
      console.log('[ipinfo] resolved as residential ISP / hosting provider, filtered out', { ip, asName: data.as_name });
      return null;
    }

    const result = {
      domain: data.as_domain,
      name: data.as_name,
      hqLocation: data.country,
      country: data.country_code,
      isBusiness: true,
    };
    console.log('[ipinfo] resolved company', { ip, result });
    return result;
  }
}
