import { getRedis } from '../config/redis.js';

// The API server (server.js) and the BullMQ workers (queues/runWorkers.js) run as
// separate processes, so a worker can't call socket.io's `io.emit` directly — there's
// no `io` instance in that process. Workers publish here instead; whichever process
// owns the socket.io server (see sockets/index.js) subscribes to this channel and
// re-emits to the right account room.
export const SOCKET_EVENTS_CHANNEL = 'viq:socket-events';

export async function publishToAccount(accountId, event, payload) {
  const message = JSON.stringify({ accountId, event, payload });
  await getRedis().publish(SOCKET_EVENTS_CHANNEL, message);
  console.log('[socket-publish]', { accountId, event, payload });
}
