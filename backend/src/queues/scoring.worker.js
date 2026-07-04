import { Worker } from 'bullmq';
import { getQueueConnection, QUEUE_NAMES } from './connection.js';
import { computeScore } from '../services/scoringEngine.js';
import Visit from '../models/Visit.js';
import Account from '../models/Account.js';
import Company from '../models/Company.js';
import ScoringRule from '../models/ScoringRule.js';
import { enqueueAlert } from './alertQueue.js';
import { publishToAccount } from '../sockets/publisher.js';

async function handleRescore(job) {
  const { visitId } = job.data;
  const visit = await Visit.findById(visitId);
  if (!visit) return { skipped: 'visit_not_found' };

  const [account, company, rules] = await Promise.all([
    Account.findById(visit.account),
    Company.findById(visit.company),
    ScoringRule.find({ account: visit.account, active: true }),
  ]);

  const context = {
    pagePaths: visit.highIntentPagesViewed,
    sessionCountInWindow: visit.sessionCount,
    totalTimeOnSiteSeconds: visit.totalTimeOnSiteSeconds,
    company: company ? company.toObject() : {},
    icp: account?.icp,
    lastSeenAt: visit.lastSeenAt,
  };

  const { score, tier } = computeScore(context, rules);
  const previousTier = visit.tier;

  visit.score = score;
  visit.tier = tier;
  await visit.save();

  console.log('[scoring.worker] rescored visit', {
    visitId: String(visit._id),
    company: context.company?.domain,
    score,
    tier,
    previousTier,
  });

  await publishToAccount(String(visit.account), 'lead:updated', {
    visitId: String(visit._id),
    companyId: String(visit.company),
    score,
    tier,
  });

  if (tier === 'hot' && previousTier !== 'hot') {
    await enqueueAlert({ visitId: String(visit._id), reason: 'tier_became_hot' });
    await publishToAccount(String(visit.account), 'lead:hot', { visitId: String(visit._id), score });
  }

  return { processed: true, score, tier };
}

export function startScoringWorker() {
  return new Worker(QUEUE_NAMES.SCORING, handleRescore, { connection: getQueueConnection(), concurrency: 10 });
}
