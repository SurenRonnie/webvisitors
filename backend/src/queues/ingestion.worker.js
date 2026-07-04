import { Worker } from 'bullmq';
import UAParser from 'ua-parser-js';
import { getQueueConnection, QUEUE_NAMES } from './connection.js';
import { hashIp, anonymizeIp, isPrivateIp } from '../utils/ipUtils.js';
import { shouldFilterHit } from '../services/botFilter.js';
import Website from '../models/Website.js';
import Session from '../models/Session.js';
import PageView from '../models/PageView.js';
import Visit from '../models/Visit.js';
import { enqueueEnrichment } from './enrichmentQueue.js';
import { enqueueScoring } from './scoringQueue.js';

const HIGH_INTENT_PATTERNS = ['/pricing', '/demo', '/contact', '/signup'];

async function handleHit(job) {
  const hit = job.data;
  console.log('[ingestion.worker] processing hit', { trackingId: hit.trackingId, sessionId: hit.sessionId, path: hit.path, ip: hit.ip });

  const website = await Website.findOne({ trackingId: hit.trackingId });
  if (!website) {
    console.log('[ingestion.worker] skipped — unknown trackingId', hit.trackingId);
    return { skipped: 'unknown_tracking_id' };
  }

  const isPrivate = isPrivateIp(hit.ip);
  if (shouldFilterHit({ userAgent: hit.userAgent, isPrivate })) {
    console.log('[ingestion.worker] skipped — bot or private IP', { ip: hit.ip, isPrivate, userAgent: hit.userAgent });
    return { skipped: 'bot_or_private_ip' };
  }

  const ipToStore = website.ipAnonymization ? anonymizeIp(hit.ip) : hit.ip;
  const ipHash = hashIp(ipToStore);
  const ua = new UAParser(hit.userAgent).getResult();

  const startedAt = new Date(hit.timestamp);
  const session = await Session.findOneAndUpdate(
    { website: website._id, externalId: hit.sessionId },
    {
      $setOnInsert: {
        website: website._id,
        externalId: hit.sessionId,
        ipHash,
        referrer: hit.referrer,
        utmSource: hit.utmSource,
        utmMedium: hit.utmMedium,
        utmCampaign: hit.utmCampaign,
        device: ua.device.type || 'desktop',
        browser: ua.browser.name,
        os: ua.os.name,
        startedAt,
      },
      ...(hit.isUnload
        ? { $set: { endedAt: startedAt, durationSeconds: hit.timeOnPageSeconds || 0 } }
        : {}),
    },
    { upsert: true, new: true }
  );

  await PageView.create({
    session: session._id,
    url: hit.url,
    path: hit.path,
    title: hit.title,
    timeOnPageSeconds: hit.timeOnPageSeconds || 0,
    viewedAt: startedAt,
  });

  const isHighIntent = HIGH_INTENT_PATTERNS.some((p) => hit.path.includes(p));

  if (!session.visit) {
    // First hit of this browser session: company isn't known yet, hand off to enrichment.
    console.log('[ingestion.worker] no visit yet on session, enqueueing enrichment', { sessionId: String(session._id), ip: ipToStore });
    await enqueueEnrichment({
      sessionId: String(session._id),
      websiteId: String(website._id),
      accountId: String(website.account),
      ip: ipToStore,
      path: hit.path,
      isHighIntent,
      timeOnPageSeconds: hit.timeOnPageSeconds || 0,
      startedAt: startedAt.toISOString(),
    });
  } else {
    const update = {
      $set: { lastSeenAt: startedAt },
      $inc: { pageViewCount: 1, totalTimeOnSiteSeconds: hit.timeOnPageSeconds || 0 },
    };
    if (isHighIntent) update.$addToSet = { highIntentPagesViewed: hit.path };
    const visit = await Visit.findByIdAndUpdate(session.visit, update, { new: true });
    if (visit) {
      console.log('[ingestion.worker] updated existing visit, enqueueing scoring', { visitId: String(visit._id) });
      await enqueueScoring({ visitId: String(visit._id) });
    }
  }

  return { processed: true };
}

export function startIngestionWorker() {
  return new Worker(QUEUE_NAMES.INGESTION, handleHit, { connection: getQueueConnection(), concurrency: 10 });
}
