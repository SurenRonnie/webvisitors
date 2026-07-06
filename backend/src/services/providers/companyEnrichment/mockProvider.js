import { CompanyEnrichmentProvider } from './CompanyEnrichmentProvider.js';

// Deterministic, no network calls — used when COMPANY_ENRICHMENT_PROVIDER=mock (tests/offline dev).
export class MockCompanyEnrichmentProvider extends CompanyEnrichmentProvider {
  async enrich({ domain }) {
    const slug = domain.split('.')[0];
    return {
      industry: 'Software',
      socialLinks: { linkedinUrl: `https://linkedin.com/company/${slug}` },
      techStack: ['WordPress', 'Google Analytics'],
      logoUrl: `https://logo.clearbit.com/${domain}`,
    };
  }
}
