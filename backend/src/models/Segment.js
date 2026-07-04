import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    // Example filter: { minScore: 70, countries: ["US"], minEmployees: 200, firstVsReturning: "returning" }
    filter: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model('Segment', segmentSchema);
