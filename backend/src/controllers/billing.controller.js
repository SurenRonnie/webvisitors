import Account from '../models/Account.js';
import { createCheckoutSession, getPlanCatalog } from '../services/providers/billing/stripeAdapter.js';

export async function getPlans(req, res) {
  res.json({ plans: getPlanCatalog() });
}

export async function startCheckout(req, res) {
  const { plan } = req.body;
  const session = await createCheckoutSession({ accountId: req.accountId, plan });
  res.json({ session });
}

export async function setPlan(req, res) {
  // Called after a (mock or real) checkout completes.
  const { plan } = req.body;
  const account = await Account.findByIdAndUpdate(req.accountId, { plan }, { new: true });
  res.json({ account });
}
