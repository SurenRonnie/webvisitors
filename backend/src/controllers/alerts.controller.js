import AlertRule from '../models/AlertRule.js';
import ScoringRule from '../models/ScoringRule.js';
import { DEFAULT_RULES } from '../services/scoringEngine.js';

export async function listAlertRules(req, res) {
  const alertRules = await AlertRule.find(req.scoped());
  res.json({ alertRules });
}

export async function createAlertRule(req, res) {
  const { name, condition, channel, target } = req.body;
  if (!name || !condition || !channel) return res.status(400).json({ error: 'name, condition, channel are required' });
  const alertRule = await AlertRule.create({ account: req.accountId, name, condition, channel, target });
  res.status(201).json({ alertRule });
}

export async function updateAlertRule(req, res) {
  const alertRule = await AlertRule.findOneAndUpdate({ _id: req.params.id, account: req.accountId }, req.body, { new: true });
  if (!alertRule) return res.status(404).json({ error: 'Alert rule not found' });
  res.json({ alertRule });
}

export async function deleteAlertRule(req, res) {
  await AlertRule.deleteOne({ _id: req.params.id, account: req.accountId });
  res.status(204).end();
}

export async function listScoringRules(req, res) {
  const scoringRules = await ScoringRule.find(req.scoped());
  res.json({ scoringRules: scoringRules.length ? scoringRules : DEFAULT_RULES, usingDefaults: scoringRules.length === 0 });
}

export async function upsertScoringRules(req, res) {
  const { rules } = req.body;
  if (!Array.isArray(rules)) return res.status(400).json({ error: 'rules must be an array' });

  await ScoringRule.deleteMany({ account: req.accountId });
  const created = await ScoringRule.insertMany(rules.map((r) => ({ ...r, account: req.accountId })));
  res.json({ scoringRules: created });
}
