import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    provider: {
      type: String,
      enum: ['hubspot', 'salesforce', 'pipedrive', 'slack', 'zapier_webhook', 'google_ads', 'linkedin_ads'],
      required: true,
    },
    status: { type: String, enum: ['disconnected', 'connected', 'error'], default: 'disconnected' },
    // OAuth-shaped credential fields, modeled for future real connections but populated by mock adapters today.
    credentials: {
      accessToken: String,
      refreshToken: String,
      expiresAt: Date,
      webhookUrl: String,
    },
    fieldMapping: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

integrationSchema.index({ account: 1, provider: 1 }, { unique: true });

export default mongoose.model('Integration', integrationSchema);
