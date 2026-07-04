import { Queue } from 'bullmq';
import { getQueueConnection, QUEUE_NAMES } from './connection.js';

let queue;

export function getScoringQueue() {
  if (!queue) {
    queue = new Queue(QUEUE_NAMES.SCORING, { connection: getQueueConnection() });
  }
  return queue;
}

export async function enqueueScoring({ visitId }) {
  return getScoringQueue().add('rescore', { visitId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  });
}
