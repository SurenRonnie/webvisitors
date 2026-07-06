import * as cheerio from 'cheerio';
import { CompanyEnrichmentProvider } from './CompanyEnrichmentProvider.js';

// No paid API involved: we fetch the company's own public homepage (first-party data,
// not scraping a third party like LinkedIn) and read what it already publishes —
// its title/description, footer social links, and the tech fingerprints in its HTML.

const SOCIAL_PATTERNS = {
  linkedinUrl: /linkedin\.com\/company\/[^"'\s>]+/i,
  twitterUrl: /(?:twitter\.com|x\.com)\/[^"'\s>/#]+/i,
  facebookUrl: /facebook\.com\/[^"'\s>]+/i,
  instagramUrl: /instagram\.com\/[^"'\s>]+/i,
  youtubeUrl: /youtube\.com\/(?:c\/|channel\/|@)[^"'\s>]+/i,
};

const INDUSTRY_KEYWORDS = {
  Software: ['saas', 'software', 'api platform', 'cloud platform'],
  'E-commerce': ['shop now', 'add to cart', 'ecommerce', 'e-commerce', 'checkout'],
  Fintech: ['fintech', 'payments platform', 'banking', 'lending', 'investing app'],
  Healthcare: ['healthcare', 'clinic', 'patients', 'medical practice', 'pharma'],
  Marketing: ['marketing agency', 'seo agency', 'advertising agency', 'branding studio'],
  Education: ['university', 'online course', 'e-learning', 'higher education'],
  Manufacturing: ['manufacturing', 'industrial equipment', 'supply chain', 'factory'],
  'Real Estate': ['real estate', 'property listings', 'realtor'],
};

const TECH_SIGNATURES = [
  { name: 'WordPress', pattern: /wp-content|wp-includes/i },
  { name: 'Shopify', pattern: /cdn\.shopify\.com|shopify\.com\/s\//i },
  { name: 'Webflow', pattern: /webflow\.com|wf-page/i },
  { name: 'Wix', pattern: /wix\.com|wixstatic\.com/i },
  { name: 'Squarespace', pattern: /squarespace\.com/i },
  { name: 'HubSpot', pattern: /hs-scripts\.com|js\.hubspot\.com/i },
  { name: 'Salesforce', pattern: /force\.com/i },
  { name: 'Google Analytics', pattern: /google-analytics\.com|gtag\(/i },
  { name: 'Segment', pattern: /cdn\.segment\.com/i },
  { name: 'Intercom', pattern: /widget\.intercom\.io/i },
  { name: 'Next.js/React', pattern: /__next|_next\/static/i },
  { name: 'Cloudflare', pattern: /cdn-cgi\/|cloudflare\.com/i },
];

function classifyIndustry(text) {
  const lower = text.toLowerCase();
  let best;
  let bestScore = 0;
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const score = keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = industry;
    }
  }
  return best;
}

function detectTechStack(html) {
  return TECH_SIGNATURES.filter((sig) => sig.pattern.test(html)).map((sig) => sig.name);
}

function extractSocialLinks(html) {
  const socialLinks = {};
  for (const [key, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    const match = html.match(pattern);
    if (match) socialLinks[key] = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
  }
  return socialLinks;
}

export class WebsiteScrapeCompanyEnrichmentProvider extends CompanyEnrichmentProvider {
  async enrich({ domain }) {
    console.log('[company-scrape] fetching homepage', { domain });
    let html;
    try {
      const res = await fetch(`https://${domain}`, {
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'VisitorIQ-Enrichment/1.0 (+https://visitoriq.local)' },
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      html = await res.text();
    } catch (err) {
      console.error('[company-scrape] fetch failed', { domain, error: err.message });
      return null;
    }

    const $ = cheerio.load(html);
    const name =
      $('meta[property="og:site_name"]').attr('content')?.trim() ||
      $('title').first().text().trim().split(/[|–-]/)[0].trim() ||
      undefined;
    const description =
      $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    const bodyText = $('body').text().replace(/\s+/g, ' ').slice(0, 20000);

    const result = {
      name,
      industry: classifyIndustry(`${name || ''} ${description} ${bodyText}`),
      socialLinks: extractSocialLinks(html),
      techStack: detectTechStack(html),
      logoUrl: `https://logo.clearbit.com/${domain}`,
    };
    console.log('[company-scrape] enriched', { domain, result });
    return result;
  }
}
