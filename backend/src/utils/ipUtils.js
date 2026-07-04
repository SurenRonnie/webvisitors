import crypto from 'crypto';

export function hashIp(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export function extractClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || '0.0.0.0';
}

export function anonymizeIp(ip) {
  // Zero out the last octet (IPv4) so the identity is coarsened but geolocation-ish
  // resolution still roughly works, matching common GDPR "IP anonymization" toggles.
  if (ip.includes('.')) {
    const parts = ip.split('.');
    parts[3] = '0';
    return parts.join('.');
  }
  const segments = ip.split(':');
  return segments.slice(0, 4).concat(Array(segments.length - 4).fill('0')).join(':');
}

const PRIVATE_IP_PATTERNS = [/^10\./, /^127\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[0-1])\./, /^::1$/];

export function isPrivateIp(ip) {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
}
