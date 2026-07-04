import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    plan: { type: String, enum: ['trial', 'starter', 'growth', 'scale'], default: 'trial' },
    icp: {
      industries: [String],
      minEmployees: Number,
      maxEmployees: Number,
      countries: [String],
    },
    dataRetentionDays: { type: Number, default: 400 },
    ipAnonymization: { type: Boolean, default: false },
    consentModeEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Account', accountSchema);
