import { CrmAdapter } from './CrmAdapter.js';
import { env } from '../../../config/env.js';

// Mock-backed: env.crm.hubspot has no client secret configured yet, so this simulates
// a successful OAuth exchange and upsert rather than calling the real HubSpot API.
// Swap the bodies of these two methods for real `fetch` calls against
// api.hubapi.com once HUBSPOT_CLIENT_ID/SECRET are set, keeping the same interface.
export class HubspotAdapter extends CrmAdapter {
  get providerName() {
    return 'hubspot';
  }

  async exchangeCode(code) {
    if (!env.crm.hubspot.clientId) {
      return { accessToken: `mock-hubspot-token-${code}`, refreshToken: 'mock-refresh', expiresAt: new Date(Date.now() + 3600_000) };
    }
    throw new Error('Live HubSpot OAuth not configured in this environment');
  }

  async upsertCompany({ company, visit }) {
    return { externalId: `hubspot-mock-${company.domain}` };
  }
}
