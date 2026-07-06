import dotenv from 'dotenv';

dotenv.config();

function bool(value, fallback) {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',

  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/visitoriq',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  ipToCompanyProvider: process.env.IP_TO_COMPANY_PROVIDER || 'mock',
  ipinfoApiToken: process.env.IPINFO_API_TOKEN || '',

  companyEnrichmentProvider: process.env.COMPANY_ENRICHMENT_PROVIDER || 'own_dataset',

  contactProvider: process.env.CONTACT_PROVIDER || 'own_dataset',

  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.ALERT_EMAIL_FROM || 'alerts@visitoriq.local',
  },

  crm: {
    hubspot: { clientId: process.env.HUBSPOT_CLIENT_ID || '', clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '' },
    salesforce: { clientId: process.env.SALESFORCE_CLIENT_ID || '', clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '' },
    pipedrive: { clientId: process.env.PIPEDRIVE_CLIENT_ID || '', clientSecret: process.env.PIPEDRIVE_CLIENT_SECRET || '' },
  },

  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  enrichmentCacheTtlSeconds: Number(process.env.ENRICHMENT_CACHE_TTL_SECONDS || 604800),

  isProduction: bool(process.env.NODE_ENV === 'production', false),
};
