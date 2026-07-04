import { Queue } from 'bullmq';
import { getQueueConnection, QUEUE_NAMES } from './connection.js';

let queue;

export function getEnrichmentQueue() {
  if (!queue) {
    queue = new Queue(QUEUE_NAMES.ENRICHMENT, { connection: getQueueConnection() });
  }
  return queue;
}

export async function enqueueEnrichment(job) {
  return getEnrichmentQueue().add('resolve', job, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  });
}
