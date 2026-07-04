import Redis from 'ioredis';
import { env } from '../config/env.js';

// BullMQ needs its own dedicated ioredis connection (maxRetriesPerRequest: null)
// separate from the general-purpose cache client in config/redis.js.
let connection;

export function getQueueConnection() {
  if (!connection) {
    connection = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
    connection.on('error', (err) => console.error('[queues] redis connection error — is Redis running at', env.redisUrl, '?', err.message));
  }
  return connection;
}

export const QUEUE_NAMES = {
  INGESTION: 'ingestion',
  ENRICHMENT: 'enrichment',
  SCORING: 'scoring',
  ALERT: 'alert',
};
