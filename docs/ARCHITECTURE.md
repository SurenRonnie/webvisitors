# VisitorIQ — Architecture

## 1. System overview & data flow

```
Customer website
   │  <script src=".../tracker.js" data-tracking-id="...">
   ▼
tracker.js (sendBeacon/fetch) ──POST /api/ingest/hit──▶ Express ingest route
                                                             │ enqueue
                                                             ▼
                                                    ingestion queue (BullMQ/Redis)
                                                             │
                                                    ingestion.worker
                                                      • bot/private-IP filter
                                                      • upsert Session (by browser sessionId)
                                                      • create PageView
                                                      • first hit of a session? → enrichment queue
                                                      • later hits? → update Visit aggregate → scoring queue
                                                             │
                                                             ▼
                                                    enrichment queue
                                                             │
                                                    enrichment.worker
                                                      • Redis cache check (enrichment:ip:<ip>)
                                                      • IP-to-company provider (IPinfo / mock)
                                                      • upsert Company
                                                      • upsert Visit (website+company)
                                                      • attach Session → Visit
                                                      • company-detail provider (own-dataset site scrape / mock) → Company socials/industry/techStack/logo
                                                      • contact-enrichment provider (own-dataset team-page scrape / mock) → Contact docs
                                                      • → scoring queue
                                                             │
                                                             ▼
                                                    scoring queue
                                                             │
                                                    scoring.worker
                                                      • computeScore() against account ScoringRules
                                                      • update Visit.score/tier
                                                      • emit socket.io `lead:updated` (and `lead:hot`)
                                                      • tier flips to hot → alert queue
                                                             │
                                                             ▼
                                                    alert queue
                                                             │
                                                    alert.worker
                                                      • Slack webhook, AlertRule email/webhook fanout
                                                      • AuditLog entry

Dashboard (Next.js) ──REST (/api/*)──▶ Express API ──▶ MongoDB
                    ──socket.io──────▶ live `lead:updated` / `lead:hot` events
```

Two backend processes:
- `npm run dev` (or `start`) — the Express API + socket.io server (`backend/src/server.js`).
- `npm run dev:worker` (or `start:worker`) — the BullMQ workers (`backend/src/queues/runWorkers.js`), scaled independently of the API.

## 2. Database schema (MongoDB / Mongoose)

| Collection | Key fields | Notes |
|---|---|---|
| `accounts` | name, plan, icp{industries,minEmployees,maxEmployees,countries}, dataRetentionDays, ipAnonymization, consentModeEnabled | Tenant root |
| `users` | account, email, passwordHash, role (admin/sales/viewer) | |
| `websites` | account, domain, trackingId (unique), ipAnonymization, installVerifiedAt | trackingId is the tracker.js credential |
| `companies` | domain (unique), name, industry, employeeCount, estimatedRevenue, hqLocation, country, socialLinks{linkedin/twitter/facebook/instagram/youtube}, logoUrl, techStack, enrichmentSource | Cached firmographic data — never re-enriched within cache TTL |
| `visits` | account, website, company, firstSeenAt, lastSeenAt, sessionCount, totalTimeOnSiteSeconds, pageViewCount, highIntentPagesViewed, score, tier, tags, notes, pushedToCrm | One row per (website, company) — the "Company Visit" the Lead Feed displays |
| `sessions` | website, externalId (browser sessionId), visit (nullable until enrichment completes), ipHash, referrer, utm*, device, browser, os, isBot, startedAt/endedAt | |
| `pageviews` | session, url, path, title, timeOnPageSeconds, viewedAt | High-write; indexed by session+viewedAt |
| `contacts` | company, name, title, email, emailConfidence, linkedinUrl, source | |
| `scoringrules` | account, type (page_match/session_count/time_on_site/company_fit/recency), config, weight, active | Admin-configurable weights; falls back to `DEFAULT_RULES` if empty |
| `segments` | account, owner, name, filter (JSON) | Saved Lead Feed filters |
| `integrations` | account, provider (hubspot/salesforce/pipedrive/slack/zapier_webhook/...), status, credentials, fieldMapping | |
| `alertrules` | account, name, condition, channel (slack/email/webhook), target | |
| `auditlogs` | account, actor, action, target, metadata | SOC2-style trail |

Key indexes: `visits{website,company}` unique, `visits{account,score desc}`, `sessions{website,externalId}` unique, `pageviews{session,viewedAt}`, `companies{domain}` unique.

## 3. Core API endpoints

| Method & path | Purpose |
|---|---|
| `POST /api/auth/signup` / `login` / `GET /me` | Account + user auth (JWT) |
| `POST /api/ingest/hit` | Public — tracker.js hit ingestion (rate-limited, no auth) |
| `GET/POST /api/websites`, `GET /api/websites/:id/install-status` | Site management + onboarding "waiting for data" check |
| `GET /api/companies/feed` | Lead Feed — filter by score/tier/industry/country/size/first-vs-returning/page, sortable |
| `GET /api/companies/visits/:visitId` | Company profile: visit + sessions + pageviews + contacts + heatmap |
| `POST /api/companies/visits/:visitId/notes`, `PUT .../tags` | Notes/tags on a visit |
| `GET/POST/PUT/DELETE /api/segments` | Saved segments |
| `GET /api/contacts/:companyId`, `POST /api/contacts/:companyId/refresh` | Contact Finder |
| `GET /api/integrations`, `POST /api/integrations/crm/:provider/connect`, `.../push`, `POST /api/integrations/webhook/:provider`, `DELETE /api/integrations/:provider` | CRM/Slack/Zapier integrations |
| `GET/POST/PUT/DELETE /api/alerts`, `GET/PUT /api/alerts/scoring-rules` | Alert rules + lead-scoring rule configuration |
| `GET /api/reports/attribution`, `GET /api/reports/pipeline-summary` | Campaign attribution + pipeline totals |
| `GET /api/billing/plans`, `POST /api/billing/checkout`, `POST /api/billing/set-plan` | Billing (mock Stripe) |
| `GET/PUT /api/account`, `GET/POST /api/account/team`, `POST /api/account/gdpr/delete` | Account/ICP settings, team, GDPR erasure |

### Cross-origin tracking & real-time updates

`tracker.js` runs on whatever third-party site installs it — a different origin than
the API (e.g. a production site hitting a dev-tunnel-exposed local backend). Two things
had to account for that:

- **CORS is split in `app.js`**: `/api/ingest/hit` uses `cors({ origin: true })` (reflects
  any origin — it's secured by the per-website `trackingId`, not an origin allowlist).
  All other `/api/*` routes stay locked to `FRONTEND_ORIGIN` (your dashboard's origin).
- **Worker → socket.io is via Redis pub/sub, not a direct call.** The API server
  (`server.js`) and the BullMQ workers (`queues/runWorkers.js`) are separate processes.
  Workers can't reach the `io` instance directly, so `scoring.worker.js` calls
  `publishToAccount()` (`sockets/publisher.js`), which publishes to a Redis channel;
  `sockets/index.js` subscribes on a dedicated connection and re-emits to the right
  `account:<id>` room. Route handlers running inside the API process itself can still
  use `emitToAccount()` directly.

Every stage of the pipeline (`ingest.controller.js`, `ingestion.worker.js`,
`enrichment.worker.js`, `scoring.worker.js`, `sockets/index.js`, and `tracker.js` itself)
logs to the console — useful while pointing a live site at a tunnel URL and watching a
hit travel through. Silence tracker.js logging with `data-debug="false"` on the script tag.

## 4. Provider adapters & tradeoffs

| Capability | Real provider wired up | Why | Mock-backed alternatives kept behind the same interface |
|---|---|---|---|
| IP → company | **IPinfo.io** (`IP_TO_COMPANY_PROVIDER=ipinfo`, `IPINFO_API_TOKEN`) | Only paid-adjacent step that's unavoidable — free-tier ASN lookup, no card required. ASN business/isp/hosting classification used for the bot/proxy filter | `mockProvider.js` — deterministic per-IP sample data, used when no key is set |
| Company detail enrichment (socials, industry, tech stack, logo) | **own-dataset website scrape** (`COMPANY_ENRICHMENT_PROVIDER=own_dataset`, default, no key) — `websiteScrapeProvider.js` fetches the resolved company's own homepage and reads its `<title>`/meta tags, footer social links (LinkedIn/X/Facebook/Instagram/YouTube), and known JS/CDN fingerprints (WordPress, Shopify, HubSpot, etc.) for a lightweight tech stack; industry is a keyword-scored guess over the page text | Zero cost, first-party data (scraping the company's own site, not a third party) | `mockProvider.js` — deterministic sample socials/tech stack |
| Contact/decision-maker enrichment | **own-dataset team-page scrape** (`CONTACT_PROVIDER=own_dataset`, default, no key) — `ownDatasetProvider.js` checks common `/team`, `/leadership`, `/about` paths on the company's own site for schema.org `Person` markup or team-card layouts, then guesses `firstname.lastname@domain` emails (unverified, low `emailConfidence`) | Zero cost, no LinkedIn scraping (would violate LinkedIn's ToS) — first-party data only. **Coverage is a real limitation**: works well on sites with structured team pages, finds nothing on JS-rendered/obfuscated ones (cheerio only sees static HTML, no headless browser) | `mockProvider.js` — deterministic sample contacts |
| CRM sync | none live | No OAuth app credentials supplied for HubSpot/Salesforce/Pipedrive | All three adapters implement `exchangeCode`/`upsertCompany` against the same `CrmAdapter` interface with mock responses — swap the method bodies for real REST calls once a developer app is registered |
| Alerts | **Slack** incoming webhook is real (`SLACK_WEBHOOK_URL` or per-account Integration) | Doesn't require an OAuth app, just a webhook URL | Email uses `nodemailer`'s `jsonTransport` (logs instead of sending) until `SMTP_HOST` is set |
| Billing | none live | No `STRIPE_SECRET_KEY` supplied | `stripeAdapter.js` mocks `createCheckoutSession`; swap for real `stripe.checkout.sessions.create` |

To go live with a mocked provider: set the corresponding env var(s) in `backend/.env` and, for CRM, replace the two adapter methods' bodies — no caller code changes needed anywhere else, since everything goes through the adapter interfaces in `backend/src/services/providers/`.

**Note on `logo.clearbit.com/<domain>` used for `logoUrl`**: this is Clearbit's historically free, keyless logo endpoint (not the paid enrichment API) — verify it's still serving before relying on it in production, since Clearbit was acquired by HubSpot and free endpoints can change without notice.

**Improving own-dataset contact coverage further** (not built, listed for later): render pages with a headless browser (Puppeteer/Playwright, still free/open-source) instead of a plain `fetch`, to catch team pages that only populate via client-side JS — the current scraper only sees static HTML.

## 5. Assumptions made (flagged for correction)

- **MongoDB + Redis**, not Postgres/ClickHouse — per explicit instruction, trading off some of the "columnar store for time-series" guidance in the original spec for operational simplicity. `pageviews`/`sessions` are still indexed for the access patterns used today; revisit if pageview volume grows past what a single Mongo replica set comfortably handles.
- **Live feed uses socket.io** (not plain polling) — the spec allowed either; sockets give a more real-time feel for "Hot lead just arrived" and cost little extra code.
- **JWT auth, no external IdP** — matches the "Node.js only" backend constraint; there's no SSO/OAuth login for VisitorIQ's own users.
- **Visit aggregate fields (`sessionCount`, `pageViewCount`, etc.) are simplifying approximations** — e.g. `session_count` scoring doesn't currently enforce the literal 30-day rolling window per rule config; it uses the running total on the Visit document. Good enough for MVP; a precise windowed count would need a query over `sessions` by `startedAt`.
- **CRM/Stripe are structurally complete but mock-backed** — see section 4. This was an explicit scope call since no credentials exist for those services.

## 6. Roadmap (MVP → v1 → v2)

**MVP (this build)**: tracking snippet, ingestion pipeline, IP-to-company (real via IPinfo), company detail + contact enrichment (real, own-dataset website scraping — no paid API), enrichment cache, configurable lead scoring, live dashboard feed + company profile, contact finder, Slack alerts (real), CRM/billing/ads as mock-backed adapters, GDPR toggles + deletion workflow, onboarding wizard.

**v1**: Wire real OAuth for at least one CRM (HubSpot is the natural first pick — richest free developer tier), real email digest via a transactional provider, webhook signature verification for Zapier, per-rule rolling-window scoring (precise 30-day session counts via aggregation), rate-limit/anti-abuse hardening on `/ingest/hit`, audit-log viewer UI.

**v2**: Salesforce + Pipedrive live connectors, Google/LinkedIn Ads retargeting audience export, Stripe live billing + usage metering by monthly identified companies, multi-website rollups, agency/white-label theming (the design-token groundwork is already in `tailwind.config.js`), SOC2-style access reviews on `auditlogs`.

## 7. Running it locally

```bash
# from repo root
npm install

# backend/.env — copy backend/.env.example and fill in:
#   MONGODB_URI, REDIS_URL (point at your own Mongo/Redis instances)
#   IPINFO_API_TOKEN + IP_TO_COMPANY_PROVIDER=ipinfo (free-tier key, only paid-adjacent step)
#   COMPANY_ENRICHMENT_PROVIDER=own_dataset and CONTACT_PROVIDER=own_dataset are the defaults —
#     no key needed, both scrape the resolved company's own public website
#   (leave CRM/Stripe/APOLLO_API_KEY vars blank to keep those mock-backed/unused)
cp backend/.env.example backend/.env

npm run dev:backend   # API + sockets on :4000
npm run dev:worker     # separate process: ingestion/enrichment/scoring/alert workers
npm run dev:frontend   # Next.js dashboard on :3000 (set NEXT_PUBLIC_API_URL if not :4000)
```

Smoke test the ingestion pipeline once both processes are running:

```bash
curl -X POST http://localhost:4000/api/ingest/hit \
  -H 'Content-Type: application/json' \
  -d '{"trackingId":"<a website trackingId>","sessionId":"test-session-1","url":"https://example.com/pricing","path":"/pricing","title":"Pricing","userAgent":"Mozilla/5.0"}'
```

Then `GET /api/companies/feed` (with an auth token) should show a new Visit within a second or two once the workers process the queued jobs.
