import mongoose from 'mongoose';

// A "Visit" is the deduplicated Company<->Website timeline: one per (website, company) pair,
// aggregating all sessions from that company so the dashboard shows one row per company, not per hit.
const visitSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    website: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    firstSeenAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    sessionCount: { type: Number, default: 0 },
    totalTimeOnSiteSeconds: { type: Number, default: 0 },
    pageViewCount: { type: Number, default: 0 },
    highIntentPagesViewed: [String],
    score: { type: Number, default: 0, index: true },
    tier: { type: String, enum: ['cold', 'warm', 'hot'], default: 'cold', index: true },
    tags: [String],
    notes: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        body: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    pushedToCrm: { type: Boolean, default: false },
  },
  { timestamps: true }
);

visitSchema.index({ website: 1, company: 1 }, { unique: true });
visitSchema.index({ account: 1, score: -1 });

export default mongoose.model('Visit', visitSchema);
