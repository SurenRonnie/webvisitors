import mongoose from 'mongoose';

const alertRuleSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    name: { type: String, required: true },
    // Example condition: { tier: "hot" } or { targetAccountDomains: ["acme.com"] }
    condition: { type: mongoose.Schema.Types.Mixed, required: true },
    channel: { type: String, enum: ['slack', 'email', 'webhook'], required: true },
    target: { type: String }, // email address or webhook URL, slack uses account-level Integration
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('AlertRule', alertRuleSchema);
