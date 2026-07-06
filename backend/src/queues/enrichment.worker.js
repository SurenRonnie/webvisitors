import { Worker } from 'bullmq';
import { getQueueConnection, QUEUE_NAMES } from './connection.js';
import {
  getCachedResolution,
  setCachedResolution,
  getCachedCompanyEnrichment,
  setCachedCompanyEnrichment,
} from '../services/enrichmentCache.js';
import { getIpToCompanyProvider } from './../services/providers/ipToCompany/index.js';
import { getContactProvider } from './../services/providers/contactEnrichment/index.js';
import { getCompanyEnrichmentProvider } from './../services/providers/companyEnrichment/index.js';
import Company from '../models/Company.js';
import Visit from '../models/Visit.js';
import Session from '../models/Session.js';
import Contact from '../models/Contact.js';
import { enqueueScoring } from './scoringQueue.js';

async function resolveCompanyForIp(ip) {
  const cached = await getCachedResolution(ip);
  if (cached !== null) {
    console.log('[enrichment.worker] cache hit', { ip, resolution: cached });
    return cached; // includes cached "null" meaning unresolvable, stored as { unresolved: true }
  }
  const provider = getIpToCompanyProvider();
  console.log('[enrichment.worker] cache miss, calling provider', { ip, provider: provider.constructor.name });
  const resolution = await provider.resolve(ip);
  console.log('[enrichment.worker] provider resolution', { ip, resolution });
  await setCachedResolution(ip, resolution ?? { unresolved: true });
  return resolution ?? { unresolved: true };
}

// Fills in what IP-to-company resolution can't: socials, industry classification,
// tech stack, logo — scraped from the company's own homepage (or cached), never re-run
// within the cache TTL once a domain has been enriched.
async function ensureCompanyDetailsEnriched(company) {
  if (company.logoUrl) return company; // already enriched (proxy for "scrape already ran")

  let enrichment = await getCachedCompanyEnrichment(company.domain);
  if (enrichment === null) {
    try {
      const provider = getCompanyEnrichmentProvider();
      enrichment = await provider.enrich({ domain: company.domain });
    } catch (err) {
      console.error('[enrichment] company detail scrape failed', { domain: company.domain, error: err.message });
      enrichment = null;
    }
    await setCachedCompanyEnrichment(company.domain, enrichment ?? {});
  }
  if (!enrichment || Object.keys(enrichment).length === 0) return company;

  return Company.findByIdAndUpdate(
    company._id,
    {
      $set: {
        ...(enrichment.name && !company.name ? { name: enrichment.name } : {}),
        ...(enrichment.industry && !company.industry ? { industry: enrichment.industry } : {}),
        ...(enrichment.socialLinks ? { socialLinks: enrichment.socialLinks, linkedinUrl: enrichment.socialLinks.linkedinUrl } : {}),
        ...(enrichment.techStack ? { techStack: enrichment.techStack } : {}),
        ...(enrichment.logoUrl ? { logoUrl: enrichment.logoUrl } : {}),
        enrichmentSource: 'own_dataset',
      },
    },
    { new: true }
  );
}

async function ensureContactsForCompany(company) {
  const existing = await Contact.countDocuments({ company: company._id });
  if (existing > 0) return;
  try {
    const provider = getContactProvider();
    const contacts = await provider.findContacts({ domain: company.domain });
    if (contacts.length) {
      const source = provider.constructor.name.toLowerCase().includes('owndataset') ? 'own_dataset' : 'mock';
      await Contact.insertMany(contacts.map((c) => ({ ...c, company: company._id, source })));
    }
  } catch (err) {
    console.error('[enrichment] contact lookup failed', err.message);
  }
}

async function handleResolve(job) {
  const { sessionId, websiteId, accountId, ip, path, isHighIntent, timeOnPageSeconds, startedAt } = job.data;
  console.log('[enrichment.worker] resolving', { sessionId, ip });

  const resolution = await resolveCompanyForIp(ip);
  if (resolution.unresolved) {
    console.log('[enrichment.worker] unresolvable IP, marking session as bot/unknown', { sessionId, ip });
    await Session.findByIdAndUpdate(sessionId, { isBot: true });
    return { skipped: 'unresolvable_ip' };
  }

  const company = await Company.findOneAndUpdate(
    { domain: resolution.domain },
    {
      $setOnInsert: { domain: resolution.domain },
      $set: {
        name: resolution.name,
        industry: resolution.industry,
        employeeCount: resolution.employeeCount,
        estimatedRevenue: resolution.estimatedRevenue,
        hqLocation: resolution.hqLocation,
        country: resolution.country,
        enrichmentSource: resolution.isBusiness ? 'ipinfo' : 'mock',
        enrichedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  const seenAt = new Date(startedAt);
  const visit = await Visit.findOneAndUpdate(
    { website: websiteId, company: company._id },
    {
      $setOnInsert: { account: accountId, website: websiteId, company: company._id, firstSeenAt: seenAt },
      $set: { lastSeenAt: seenAt },
      $inc: {
        sessionCount: 1,
        pageViewCount: 1,
        totalTimeOnSiteSeconds: timeOnPageSeconds || 0,
      },
      ...(isHighIntent ? { $addToSet: { highIntentPagesViewed: path } } : {}),
    },
    { upsert: true, new: true }
  );

  await Session.findByIdAndUpdate(sessionId, { visit: visit._id });

  console.log('[enrichment.worker] company + visit ready', {
    companyId: String(company._id),
    domain: company.domain,
    visitId: String(visit._id),
  });

  await ensureCompanyDetailsEnriched(company);
  await ensureContactsForCompany(company);
  await enqueueScoring({ visitId: String(visit._id) });

  return { processed: true, companyId: String(company._id), visitId: String(visit._id) };
}

export function startEnrichmentWorker() {
  return new Worker(QUEUE_NAMES.ENRICHMENT, handleResolve, { connection: getQueueConnection(), concurrency: 5 });
}
