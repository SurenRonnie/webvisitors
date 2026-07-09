import net from 'net';
import { IpToCompanyProvider } from './IpToCompanyProvider.js';
import { looksResidentialOrHosting } from './asnClassifier.js';

// Team Cymru's IP-to-ASN WHOIS service — completely free, keyless, no signup, no
// rate-limit tier to worry about. A single "-v <ip>" query over raw WHOIS (port 43)
// returns ASN, country, RIR registry and AS Name (the registrant organization) for
// any routable IP. This is the only ASN-name source we use that has zero paid tier
// at all (ipinfo's /lite endpoint is free but still API-key/quota gated).
const WHOIS_HOST = 'whois.cymru.com';
const WHOIS_PORT = 43;
const REQUEST_TIMEOUT_MS = 5000;

function queryCymru(ip) {
  return new Promise((resolve, reject) => {
    // `net` (unlike `fetch`) doesn't do Happy-Eyeballs fallback — on networks where
    // outbound IPv6 is routed but silently dropped, a dual-stack connect attempt just
    // hangs until the timeout instead of falling back to IPv4. Force IPv4 explicitly.
    const socket = net.createConnection({ host: WHOIS_HOST, port: WHOIS_PORT, family: 4 });
    let buffer = '';
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      fn(value);
    };

    socket.setTimeout(REQUEST_TIMEOUT_MS, () => {
      finish(reject, new Error(`Team Cymru WHOIS request timed out for ${ip}`));
    });
    socket.on('connect', () => socket.write(` -v ${ip}\n`));
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
    });
    socket.on('error', (err) => finish(reject, err));
    socket.on('close', () => finish(resolve, buffer));
  });
}

// Response looks like:
// AS      | IP               | BGP Prefix          | CC | Registry | Allocated  | AS Name
// 15169   | 8.8.8.8          | 8.8.8.0/24          | US | arin     | 1992-12-01 | GOOGLE, US
// Unroutable/private/reserved IPs come back as "NA" in place of the ASN.
function parseResponse(raw) {
  const lines = raw.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return null;

  const fields = lines[1].split('|').map((f) => f.trim());
  const [asn, , , countryCode, , , asName] = fields;
  if (!asn || asn === 'NA' || !asName) return null;

  return { asn, countryCode, asName };
}

// Team Cymru's WHOIS has no domain field whatsoever (unlike ipinfo's /lite `as_domain`),
// only the AS Name, which shows up in two common shapes:
//   "GOOGLE - Google LLC, US"            (short handle, then registered legal name)
//   "MICROSOFT-CORP-MSN-AS-BLOCK, US"    (just a registry handle, no " - " split)
// The short handle before " - " (when present) slugifies to a far better domain guess
// than the full legal name (e.g. "GOOGLE" -> google.com, not "Google LLC" -> googlellc.com).
// This is still just a best-effort guess for the own-dataset scrapers to try — a wrong
// guess makes that scrape fetch the wrong site and come back empty (caught and ignored
// in enrichment.worker), it doesn't break resolution itself.
function guessDomain(asName) {
  const beforeComma = asName.split(',')[0];
  const orgPart = beforeComma.includes(' - ') ? beforeComma.split(' - ')[0] : beforeComma;
  const slug = orgPart
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|co|company|as|asn|block|net|networks?)\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
  return slug ? `${slug}.com` : null;
}

export class CymruProvider extends IpToCompanyProvider {
  async resolve(ip) {
    console.log('[cymru] request', { ip });

    let raw;
    try {
      raw = await queryCymru(ip);
    } catch (err) {
      console.error('[cymru] request failed', { ip, error: err.message });
      throw err;
    }
    console.log('[cymru] raw response', { ip, raw });

    const parsed = parseResponse(raw);
    if (!parsed) {
      console.log('[cymru] no ASN/org data in response, unresolvable', { ip });
      return null;
    }

    if (looksResidentialOrHosting(parsed.asName)) {
      console.log('[cymru] resolved as residential ISP / hosting provider, filtered out', { ip, asName: parsed.asName });
      return null;
    }

    const domain = guessDomain(parsed.asName);
    if (!domain) {
      console.log('[cymru] could not derive a usable domain from AS name, unresolvable', { ip, asName: parsed.asName });
      return null;
    }

    const result = {
      domain,
      name: parsed.asName.split(',')[0].trim(),
      hqLocation: parsed.countryCode,
      country: parsed.countryCode,
      isBusiness: true,
    };
    console.log('[cymru] resolved company', { ip, result });
    return result;
  }
}
