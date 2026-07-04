import mongoose from 'mongoose';

// Configurable lead-scoring rules an account admin can tune. Each rule contributes
// points to a Visit's score when its `type`-specific condition matches.
const scoringRuleSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    type: {
      type: String,
      enum: ['page_match', 'session_count', 'time_on_site', 'company_fit', 'recency'],
      required: true,
    },
    // page_match: { pathPattern: "/pricing", points: 20 }
    // session_count: { per: 1, points: 5, windowDays: 30 }
    // time_on_site: { perSeconds: 60, points: 1, cap: 20 }
    // company_fit: { points: 15 } (uses account.icp for match)
    // recency: { withinHours: 24, points: 10 }
    config: { type: mongoose.Schema.Types.Mixed, required: true },
    weight: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('ScoringRule', scoringRuleSchema);
