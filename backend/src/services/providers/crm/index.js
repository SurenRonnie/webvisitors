import { HubspotAdapter } from './hubspotAdapter.js';
import { SalesforceAdapter } from './salesforceAdapter.js';
import { PipedriveAdapter } from './pipedriveAdapter.js';

const adapters = {
  hubspot: new HubspotAdapter(),
  salesforce: new SalesforceAdapter(),
  pipedrive: new PipedriveAdapter(),
};

export function getCrmAdapter(provider) {
  const adapter = adapters[provider];
  if (!adapter) throw new Error(`Unknown CRM provider: ${provider}`);
  return adapter;
}

export const SUPPORTED_CRM_PROVIDERS = Object.keys(adapters);
