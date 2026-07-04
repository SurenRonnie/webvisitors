const DEFAULT_RULES = [
  { type: 'page_match', config: { pathPattern: '/pricing', points: 20 }, weight: 1 },
  { type: 'page_match', config: { pathPattern: '/demo', points: 25 }, weight: 1 },
  { type: 'page_match', config: { pathPattern: '/blog', points: 2 }, weight: 1 },
  { type: 'session_count', config: { per: 1, points: 5, windowDays: 30, cap: 25 }, weight: 1 },
  { type: 'time_on_site', config: { perSeconds: 60, points: 1, cap: 20 }, weight: 1 },
  { type: 'company_fit', config: { points: 15 }, weight: 1 },
  { type: 'recency', config: { withinHours: 24, points: 10 }, weight: 1 },
];

function scorePageMatch(rule, { pagePaths }) {
  const { pathPattern, points } = rule.config;
  const matched = pagePaths.some((path) => path.includes(pathPattern));
  return matched ? points : 0;
}

function scoreSessionCount(rule, { sessionCountInWindow }) {
  const { per, points, cap } = rule.config;
  const raw = Math.floor(sessionCountInWindow / per) * points;
  return cap ? Math.min(raw, cap) : raw;
}

function scoreTimeOnSite(rule, { totalTimeOnSiteSeconds }) {
  const { perSeconds, points, cap } = rule.config;
  const raw = Math.floor(totalTimeOnSiteSeconds / perSeconds) * points;
  return cap ? Math.min(raw, cap) : raw;
}

function scoreCompanyFit(rule, { company, icp }) {
  if (!icp) return 0;
  const { points } = rule.config;
  let matches = 0;
  let checks = 0;

  if (icp.industries?.length) {
    checks++;
    if (company.industry && icp.industries.includes(company.industry)) matches++;
  }
  if (icp.minEmployees || icp.maxEmployees) {
    checks++;
    const count = company.employeeCount || 0;
    const min = icp.minEmployees || 0;
    const max = icp.maxEmployees || Infinity;
    if (count >= min && count <= max) matches++;
  }
  if (icp.countries?.length) {
    checks++;
    if (company.country && icp.countries.includes(company.country)) matches++;
  }

  if (checks === 0) return 0;
  return Math.round((matches / checks) * points);
}

function scoreRecency(rule, { lastSeenAt }) {
  const { withinHours, points } = rule.config;
  const hoursSince = (Date.now() - new Date(lastSeenAt).getTime()) / (1000 * 60 * 60);
  return hoursSince <= withinHours ? points : 0;
}

const SCORERS = {
  page_match: scorePageMatch,
  session_count: scoreSessionCount,
  time_on_site: scoreTimeOnSite,
  company_fit: scoreCompanyFit,
  recency: scoreRecency,
};

export function tierForScore(score) {
  if (score >= 70) return 'hot';
  if (score >= 35) return 'warm';
  return 'cold';
}

/**
 * @param {object} context - { pagePaths, sessionCountInWindow, totalTimeOnSiteSeconds, company, icp, lastSeenAt }
 * @param {Array} rules - ScoringRule documents; falls back to DEFAULT_RULES if none configured for the account.
 */
export function computeScore(context, rules) {
  const activeRules = (rules?.length ? rules : DEFAULT_RULES).filter((r) => r.active !== false);

  let total = 0;
  const breakdown = [];
  for (const rule of activeRules) {
    const scorer = SCORERS[rule.type];
    if (!scorer) continue;
    const points = scorer(rule, context) * (rule.weight ?? 1);
    total += points;
    breakdown.push({ type: rule.type, points });
  }

  const score = Math.max(0, Math.min(100, Math.round(total)));
  return { score, tier: tierForScore(score), breakdown };
}

export { DEFAULT_RULES };
