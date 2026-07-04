import { Queue } from 'bullmq';
import { getQueueConnection, QUEUE_NAMES } from './connection.js';

let queue;

export function getAlertQueue() {
  if (!queue) {
    queue = new Queue(QUEUE_NAMES.ALERT, { connection: getQueueConnection() });
  }
  return queue;
}

export async function enqueueAlert({ visitId, reason }) {
  return getAlertQueue().add('dispatch', { visitId, reason }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  });
}
