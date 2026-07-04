import { Worker } from 'bullmq';
import { getQueueConnection, QUEUE_NAMES } from './connection.js';
import Visit from '../models/Visit.js';
import Company from '../models/Company.js';
import Integration from '../models/Integration.js';
import AlertRule from '../models/AlertRule.js';
import AuditLog from '../models/AuditLog.js';
import { sendSlackAlert } from '../services/providers/notifications/slackNotifier.js';
import { sendEmail } from '../services/providers/notifications/emailNotifier.js';

async function dispatchWebhook(url, payload) {
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function handleDispatch(job) {
  const { visitId, reason } = job.data;
  const visit = await Visit.findById(visitId);
  if (!visit) return { skipped: 'visit_not_found' };
  const company = await Company.findById(visit.company);

  const summary = `🔥 Hot lead: ${company?.name || company?.domain || 'Unknown company'} (score ${visit.score}) just crossed your Hot threshold.`;

  const [slackIntegration, rules] = await Promise.all([
    Integration.findOne({ account: visit.account, provider: 'slack', status: 'connected' }),
    AlertRule.find({ account: visit.account, active: true }),
  ]);

  if (slackIntegration?.credentials?.webhookUrl) {
    await sendSlackAlert(slackIntegration.credentials.webhookUrl, { text: summary });
  }

  for (const rule of rules) {
    if (rule.condition?.tier && rule.condition.tier !== visit.tier) continue;
    if (rule.channel === 'email' && rule.target) {
      await sendEmail({ to: rule.target, subject: 'VisitorIQ: new hot lead', html: `<p>${summary}</p>` });
    } else if (rule.channel === 'webhook' && rule.target) {
      await dispatchWebhook(rule.target, { event: 'lead.hot', visitId: String(visit._id), score: visit.score, company: company?.domain });
    }
  }

  await AuditLog.create({ account: visit.account, action: 'alert.dispatched', target: String(visit._id), metadata: { reason } });

  return { processed: true };
}

export function startAlertWorker() {
  return new Worker(QUEUE_NAMES.ALERT, handleDispatch, { connection: getQueueConnection(), concurrency: 5 });
}
