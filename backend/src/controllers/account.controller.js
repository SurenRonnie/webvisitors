import bcrypt from 'bcryptjs';
import Account from '../models/Account.js';
import User from '../models/User.js';

export async function getAccount(req, res) {
  const account = await Account.findById(req.accountId);
  res.json({ account });
}

export async function updateAccount(req, res) {
  const { name, icp, dataRetentionDays, ipAnonymization, consentModeEnabled } = req.body;
  const account = await Account.findByIdAndUpdate(
    req.accountId,
    { ...(name && { name }), ...(icp && { icp }), ...(dataRetentionDays && { dataRetentionDays }), ...(ipAnonymization !== undefined && { ipAnonymization }), ...(consentModeEnabled !== undefined && { consentModeEnabled }) },
    { new: true }
  );
  res.json({ account });
}

export async function listTeam(req, res) {
  const users = await User.find(req.scoped()).select('-passwordHash');
  res.json({ users });
}

export async function inviteTeamMember(req, res) {
  const { name, email, role, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password are required' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ account: req.accountId, name, email, passwordHash, role: role || 'sales' });
  res.status(201).json({ user: { ...user.toObject(), passwordHash: undefined } });
}

// GDPR: full data-deletion workflow for a user's account, run synchronously for the MVP.
export async function requestAccountDeletion(req, res) {
  const Visit = (await import('../models/Visit.js')).default;
  const Session = (await import('../models/Session.js')).default;
  const PageView = (await import('../models/PageView.js')).default;
  const Website = (await import('../models/Website.js')).default;

  const websites = await Website.find({ account: req.accountId }).select('_id');
  const visits = await Visit.find({ account: req.accountId }).select('_id');
  const sessions = await Session.find({ visit: { $in: visits.map((v) => v._id) } }).select('_id');

  await PageView.deleteMany({ session: { $in: sessions.map((s) => s._id) } });
  await Session.deleteMany({ visit: { $in: visits.map((v) => v._id) } });
  await Visit.deleteMany({ account: req.accountId });
  await Website.deleteMany({ account: req.accountId });

  res.json({ deleted: true, websites: websites.length, visits: visits.length, sessions: sessions.length });
}
