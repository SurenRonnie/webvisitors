import { CrmAdapter } from './CrmAdapter.js';

// Mock-backed for the same reason as hubspotAdapter.js — structurally complete,
// swap in real Salesforce REST/OAuth calls once credentials are available.
export class SalesforceAdapter extends CrmAdapter {
  get providerName() {
    return 'salesforce';
  }

  async exchangeCode(code) {
    return { accessToken: `mock-salesforce-token-${code}`, refreshToken: 'mock-refresh', expiresAt: new Date(Date.now() + 3600_000) };
  }

  async upsertCompany({ company, visit }) {
    return { externalId: `salesforce-mock-${company.domain}` };
  }
}
