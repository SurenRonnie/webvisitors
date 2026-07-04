import Redis from 'ioredis';
import { env } from './env.js';

let client;

export function getRedis() {
  if (!client) {
    client = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
    client.on('error', (err) => console.error('[redis] error', err.message));
  }
  return client;
}

// BullMQ requires its own connection option object (maxRetriesPerRequest: null) per queue/worker.
export function redisConnectionOptions() {
  return { url: env.redisUrl, maxRetriesPerRequest: null };
}
