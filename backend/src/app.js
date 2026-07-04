import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import websitesRoutes from './routes/websites.routes.js';
import ingestRoutes from './routes/ingest.routes.js';
import companiesRoutes from './routes/companies.routes.js';
import segmentsRoutes from './routes/segments.routes.js';
import contactsRoutes from './routes/contacts.routes.js';
import integrationsRoutes from './routes/integrations.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import billingRoutes from './routes/billing.routes.js';
import accountRoutes from './routes/account.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '256kb' }));

  // Serves the tracking snippet: <script src=".../tracker.js" data-tracking-id="...">
  // Script tag loading isn't CORS-restricted, so no cors() needed here.
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', (req, res) => res.json({ ok: true }));

  // Tracker.js runs on whatever third-party site installs it (e.g. a production
  // portfolio site on a completely different origin than this API), so the public
  // ingest endpoint gets permissive, reflected-origin CORS — it's secured by the
  // per-website trackingId instead of an origin allowlist. Registered first so it's
  // fully handled before the stricter dashboard CORS below ever applies to it.
  app.use('/api/ingest', cors({ origin: true }), ingestRoutes);

  // Authenticated dashboard routes stay locked to FRONTEND_ORIGIN (your local
  // Next.js dev server, or wherever the dashboard is actually hosted).
  app.use(cors({ origin: env.frontendOrigin, credentials: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/websites', websitesRoutes);
  app.use('/api/companies', companiesRoutes);
  app.use('/api/segments', segmentsRoutes);
  app.use('/api/contacts', contactsRoutes);
  app.use('/api/integrations', integrationsRoutes);
  app.use('/api/alerts', alertsRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/account', accountRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
