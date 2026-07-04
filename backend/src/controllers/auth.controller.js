import bcrypt from 'bcryptjs';
import Account from '../models/Account.js';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

function toAuthResponse(user) {
  const token = signToken({ sub: String(user._id), accountId: String(user.account) });
  return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role, accountId: user.account } };
}

export async function signup(req, res) {
  const { companyName, name, email, password } = req.body;
  if (!companyName || !name || !email || !password) {
    return res.status(400).json({ error: 'companyName, name, email, password are required' });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const account = await Account.create({ name: companyName });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ account: account._id, name, email, passwordHash, role: 'admin' });

  res.status(201).json(toAuthResponse(user));
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password || '', user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  res.json(toAuthResponse(user));
}

export async function me(req, res) {
  const account = await Account.findById(req.accountId);
  res.json({ user: req.user, account });
}
