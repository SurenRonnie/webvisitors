import { connectDb } from '../config/db.js';
import { startIngestionWorker } from './ingestion.worker.js';
import { startEnrichmentWorker } from './enrichment.worker.js';
import { startScoringWorker } from './scoring.worker.js';
import { startAlertWorker } from './alert.worker.js';

await connectDb();

const workers = [startIngestionWorker(), startEnrichmentWorker(), startScoringWorker(), startAlertWorker()];

workers.forEach((worker) => {
  worker.on('failed', (job, err) => console.error(`[worker:${worker.name}] job ${job?.id} failed:`, err.message));
});

console.log('[workers] ingestion, enrichment, scoring, alert workers running');

process.on('SIGTERM', async () => {
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
});
