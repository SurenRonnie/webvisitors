import Integration from '../models/Integration.js';
import Visit from '../models/Visit.js';
import Company from '../models/Company.js';
import AuditLog from '../models/AuditLog.js';
import { getCrmAdapter, SUPPORTED_CRM_PROVIDERS } from '../services/providers/crm/index.js';

export async function listIntegrations(req, res) {
  const integrations = await Integration.find(req.scoped());
  res.json({ integrations, supportedCrmProviders: SUPPORTED_CRM_PROVIDERS });
}

// Simulates the tail end of an OAuth flow: the frontend would normally redirect to the
// provider and land back here with a `code`. Real adapters aren't wired to live OAuth apps yet.
export async function connectCrm(req, res) {
  const { provider } = req.params;
  const { code, fieldMapping } = req.body;
  const adapter = getCrmAdapter(provider);
  const credentials = await adapter.exchangeCode(code || 'mock-code');

  const integration = await Integration.findOneAndUpdate(
    { account: req.accountId, provider },
    { status: 'connected', credentials, fieldMapping: fieldMapping || {}, lastSyncedAt: new Date() },
    { upsert: true, new: true }
  );

  await AuditLog.create({ account: req.accountId, actor: req.user._id, action: 'integration.connected', target: provider });
  res.json({ integration });
}

export async function disconnectIntegration(req, res) {
  const { provider } = req.params;
  await Integration.findOneAndUpdate({ account: req.accountId, provider }, { status: 'disconnected', credentials: {} });
  res.status(204).end();
}

export async function setWebhookIntegration(req, res) {
  const { provider } = req.params; // "slack" or "zapier_webhook"
  const { webhookUrl } = req.body;
  if (!webhookUrl) return res.status(400).json({ error: 'webhookUrl is required' });

  const integration = await Integration.findOneAndUpdate(
    { account: req.accountId, provider },
    { status: 'connected', credentials: { webhookUrl } },
    { upsert: true, new: true }
  );
  res.json({ integration });
}

export async function pushVisitToCrm(req, res) {
  const { provider } = req.params;
  const { visitId } = req.body;

  const [integration, visit] = await Promise.all([
    Integration.findOne({ account: req.accountId, provider, status: 'connected' }),
    Visit.findOne({ _id: visitId, account: req.accountId }),
  ]);
  if (!integration) return res.status(400).json({ error: `${provider} is not connected` });
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  const company = await Company.findById(visit.company);
  const adapter = getCrmAdapter(provider);
  const result = await adapter.upsertCompany({ credentials: integration.credentials, company, visit, fieldMapping: integration.fieldMapping });

  visit.pushedToCrm = true;
  await visit.save();

  res.json({ result });
}
