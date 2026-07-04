import { env } from '../../../config/env.js';

const PLAN_PRICES = {
  starter: { monthlyCompanies: 250, priceUsd: 99 },
  growth: { monthlyCompanies: 1000, priceUsd: 299 },
  scale: { monthlyCompanies: 5000, priceUsd: 799 },
};

// Mock-backed: no STRIPE_SECRET_KEY supplied. Structured so a real integration
// swaps these two functions for `stripe.checkout.sessions.create` /
// `stripe.subscriptions.update` calls without touching callers in billing.routes.js.
export async function createCheckoutSession({ accountId, plan }) {
  if (!PLAN_PRICES[plan]) throw new Error(`Unknown plan: ${plan}`);
  if (env.stripeSecretKey) {
    throw new Error('Live Stripe checkout not configured in this environment');
  }
  return { url: `https://billing.mock.local/checkout/${accountId}/${plan}`, mock: true };
}

export function getPlanCatalog() {
  return PLAN_PRICES;
}
