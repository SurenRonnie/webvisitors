import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const websiteSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    domain: { type: String, required: true },
    trackingId: { type: String, required: true, unique: true, default: () => randomUUID() },
    ipAnonymization: { type: Boolean, default: false },
    dataRetentionDays: { type: Number, default: 400 },
    installVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Website', websiteSchema);
