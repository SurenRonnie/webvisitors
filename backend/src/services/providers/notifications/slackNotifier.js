import { env } from '../../../config/env.js';

// Real integration: posts to an Incoming Webhook URL configured per-account via
// the Integrations page. If no webhook URL is set, logs instead of failing loudly.
export async function sendSlackAlert(webhookUrl, { text, blocks }) {
  const url = webhookUrl || env.slackWebhookUrl;
  if (!url) {
    console.log('[slack] no webhook configured, skipping alert:', text);
    return { delivered: false, reason: 'no_webhook_configured' };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(blocks ? { text, blocks } : { text }),
  });
  if (!res.ok) throw new Error(`Slack webhook failed with status ${res.status}`);
  return { delivered: true };
}
