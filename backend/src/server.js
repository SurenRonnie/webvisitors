import { createServer } from 'http';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { initSockets } from './sockets/index.js';
import { env } from './config/env.js';

await connectDb();

const app = createApp();
const httpServer = createServer(app);
initSockets(httpServer);

httpServer.listen(env.port, () => {
  console.log(`[server] VisitorIQ API listening on port ${env.port}`);
  console.log(`[server] Dashboard CORS locked to FRONTEND_ORIGIN=${env.frontendOrigin}`);
  console.log(`[server] /api/ingest/hit accepts any origin (tracker.js can run on a different site/tunnel)`);
  console.log(`[server] IP_TO_COMPANY_PROVIDER=${env.ipToCompanyProvider}, CONTACT_PROVIDER=${env.contactProvider}`);
  console.log(`[server] Run "npm run dev:worker" in a separate process to process the ingestion/enrichment/scoring/alert queues.`);
});
