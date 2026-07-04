import { Server } from 'socket.io';
import Redis from 'ioredis';
import { env } from '../config/env.js';
import { verifyToken } from '../utils/jwt.js';
import { SOCKET_EVENTS_CHANNEL } from './publisher.js';

let io;

export function initSockets(httpServer) {
  io = new Server(httpServer, { cors: { origin: env.frontendOrigin } });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = verifyToken(token);
      socket.accountRoom = `account:${payload.accountId}`;
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log('[sockets] client connected', { room: socket.accountRoom, id: socket.id });
    socket.join(socket.accountRoom);
    socket.on('disconnect', () => console.log('[sockets] client disconnected', { room: socket.accountRoom, id: socket.id }));
  });

  // Subscribe (on a dedicated connection — a subscribing ioredis client can't run
  // other commands) so events published by the separate worker process (see
  // sockets/publisher.js) get re-emitted to the right account's connected browsers.
  const subscriber = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
  subscriber.on('error', (err) => console.error('[sockets] redis subscriber error — is Redis running at', env.redisUrl, '?', err.message));
  subscriber.subscribe(SOCKET_EVENTS_CHANNEL);
  subscriber.on('message', (channel, message) => {
    if (channel !== SOCKET_EVENTS_CHANNEL) return;
    try {
      const { accountId, event, payload } = JSON.parse(message);
      console.log('[sockets] relaying event from worker', { accountId, event });
      io.to(`account:${accountId}`).emit(event, payload);
    } catch (err) {
      console.error('[sockets] failed to relay event', err.message);
    }
  });

  return io;
}

// Called from the API server process (where a live `io` instance exists) — dashboard
// route handlers can use this directly. Workers must use publishToAccount() instead.
export function emitToAccount(accountId, event, payload) {
  if (!io) return;
  io.to(`account:${accountId}`).emit(event, payload);
}
