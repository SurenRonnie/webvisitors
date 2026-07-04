import { IpToCompanyProvider } from './IpToCompanyProvider.js';
import crypto from 'crypto';

const SAMPLE_COMPANIES = [
  { domain: 'acmecorp.com', name: 'Acme Corp', industry: 'Software', employeeCount: 340, estimatedRevenue: '$25M-$50M', hqLocation: 'Austin, TX', country: 'US' },
  { domain: 'globex.io', name: 'Globex', industry: 'Fintech', employeeCount: 1200, estimatedRevenue: '$100M-$250M', hqLocation: 'New York, NY', country: 'US' },
  { domain: 'initech.co', name: 'Initech', industry: 'IT Services', employeeCount: 80, estimatedRevenue: '$5M-$10M', hqLocation: 'Austin, TX', country: 'US' },
  { domain: 'hooli.com', name: 'Hooli', industry: 'Technology', employeeCount: 5400, estimatedRevenue: '$500M+', hqLocation: 'Palo Alto, CA', country: 'US' },
  { domain: 'umbrella-labs.eu', name: 'Umbrella Labs', industry: 'Biotech', employeeCount: 210, estimatedRevenue: '$25M-$50M', hqLocation: 'Berlin', country: 'DE' },
];

// Deterministic per-IP mock so repeated hits from the same session resolve to the same company,
// used when IP_TO_COMPANY_PROVIDER=mock (no third-party key required).
export class MockIpToCompanyProvider extends IpToCompanyProvider {
  async resolve(ip) {
    const hash = crypto.createHash('md5').update(ip).digest('hex');
    const index = parseInt(hash.slice(0, 8), 16) % (SAMPLE_COMPANIES.length + 1);
    if (index === SAMPLE_COMPANIES.length) return null; // simulate unresolvable residential IP
    return { ...SAMPLE_COMPANIES[index], isBusiness: true };
  }
}
