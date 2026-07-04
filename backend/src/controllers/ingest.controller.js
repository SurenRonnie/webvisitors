import { extractClientIp } from '../utils/ipUtils.js';
import { enqueueHit } from '../queues/ingestionQueue.js';

export async function ingestHit(req, res) {
  const { trackingId, sessionId, url, path, title, referrer, userAgent, timestamp } = req.body;
  const ip = extractClientIp(req);

  console.log('[ingest] received hit', {
    trackingId,
    sessionId,
    path,
    ip,
    origin: req.headers.origin,
  });

  if (!trackingId || !sessionId || !url || !path) {
    console.log('[ingest] rejected — missing required field(s)', { trackingId, sessionId, url, path });
    return res.status(400).json({ error: 'trackingId, sessionId, url, path are required' });
  }

  await enqueueHit({
    ...req.body,
    ip,
    userAgent: userAgent || req.headers['user-agent'],
    timestamp: timestamp || new Date().toISOString(),
  });

  console.log('[ingest] hit enqueued', { trackingId, sessionId, path });

  // 202: the hit is queued, not yet processed — tracker.js doesn't wait on this.
  res.status(202).json({ accepted: true });
}
