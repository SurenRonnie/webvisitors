import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    website: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    // Browser-generated session id from tracker.js. A Visit (company-level) is attached once
    // enrichment resolves the IP to a company asynchronously, so it starts null.
    externalId: { type: String, required: true, index: true },
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', default: null, index: true },
    ipHash: { type: String, required: true },
    referrer: { type: String },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
    device: { type: String },
    browser: { type: String },
    os: { type: String },
    isBot: { type: Boolean, default: false },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sessionSchema.index({ visit: 1, startedAt: -1 });
sessionSchema.index({ website: 1, externalId: 1 }, { unique: true });

export default mongoose.model('Session', sessionSchema);
