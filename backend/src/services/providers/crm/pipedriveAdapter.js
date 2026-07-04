import { CrmAdapter } from './CrmAdapter.js';

// Mock-backed for the same reason as hubspotAdapter.js — structurally complete,
// swap in real Pipedrive REST/OAuth calls once credentials are available.
export class PipedriveAdapter extends CrmAdapter {
  get providerName() {
    return 'pipedrive';
  }

  async exchangeCode(code) {
    return { accessToken: `mock-pipedrive-token-${code}`, refreshToken: 'mock-refresh', expiresAt: new Date(Date.now() + 3600_000) };
  }

  async upsertCompany({ company, visit }) {
    return { externalId: `pipedrive-mock-${company.domain}` };
  }
}
