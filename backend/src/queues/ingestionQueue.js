import { Queue } from 'bullmq';
import { getQueueConnection, QUEUE_NAMES } from './connection.js';

let queue;

export function getIngestionQueue() {
  if (!queue) {
    queue = new Queue(QUEUE_NAMES.INGESTION, { connection: getQueueConnection() });
  }
  return queue;
}

export async function enqueueHit(hitPayload) {
  return getIngestionQueue().add('hit', hitPayload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  });
}
