import { Worker } from 'bullmq';
import { getQueueConnection, QUEUE_NAMES } from './connection.js';
import { getCachedResolution, setCachedResolution } from '../services/enrichmentCache.js';
import { getIpToCompanyProvider } from './../services/providers/ipToCompany/index.js';
import { getContactProvider } from './../services/providers/contactEnrichment/index.js';
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

async function ensureContactsForCompany(company) {
  const existing = await Contact.countDocuments({ company: company._id });
  if (existing > 0) return;
  try {
    const provider = getContactProvider();
    const contacts = await provider.findContacts({ domain: company.domain });
    if (contacts.length) {
      await Contact.insertMany(
        contacts.map((c) => ({ ...c, company: company._id, source: provider.constructor.name.toLowerCase().includes('apollo') ? 'apollo' : 'mock' }))
      );
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

  await ensureContactsForCompany(company);
  await enqueueScoring({ visitId: String(visit._id) });

  return { processed: true, companyId: String(company._id), visitId: String(visit._id) };
}

export function startEnrichmentWorker() {
  return new Worker(QUEUE_NAMES.ENRICHMENT, handleResolve, { connection: getQueueConnection(), concurrency: 5 });
}
