import { IpToCompanyProvider } from './IpToCompanyProvider.js';
import { env } from '../../../config/env.js';
import { looksResidentialOrHosting } from './asnClassifier.js';

// The standard ipinfo.io/<ip> endpoint only includes `company.{domain,name,type}`
// as a paid "Business Data" add-on — a free-tier token gets `org` as a plain string
// (e.g. "AS15169 Google LLC") with no domain at all. IPinfo's newer `/lite` endpoint
// is free-tier and includes `as_domain`/`as_name`, which is what we actually need,
// so we use that instead and approximate "is this a business" via ASN name keywords
// (the /lite tier has no residential/business classification field).
const LITE_ENDPOINT = 'https://api.ipinfo.io/lite';

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
