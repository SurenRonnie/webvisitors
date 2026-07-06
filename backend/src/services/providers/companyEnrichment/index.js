import { env } from '../../../config/env.js';
import { WebsiteScrapeCompanyEnrichmentProvider } from './websiteScrapeProvider.js';
import { MockCompanyEnrichmentProvider } from './mockProvider.js';

let instance;

export function getCompanyEnrichmentProvider() {
  if (instance) return instance;
  instance =
    env.companyEnrichmentProvider === 'mock'
      ? new MockCompanyEnrichmentProvider()
      : new WebsiteScrapeCompanyEnrichmentProvider();
  return instance;
}
