// requireAuth already attaches req.accountId. This middleware just guarantees
// every downstream route has it, and exposes a helper so controllers never
// forget to scope a Mongo query to the caller's account (the multi-tenancy boundary).
export function tenantScope(req, res, next) {
  if (!req.accountId) return res.status(401).json({ error: 'No account context' });
  req.scoped = (extra = {}) => ({ account: req.accountId, ...extra });
  next();
}
