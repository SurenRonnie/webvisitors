import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    industry: { type: String },
    employeeCount: { type: Number },
    estimatedRevenue: { type: String },
    hqLocation: { type: String },
    country: { type: String },
    linkedinUrl: { type: String },
    techStack: [String],
    enrichmentSource: { type: String, enum: ['ipinfo', 'clearbit', 'mock', 'manual'], default: 'mock' },
    enrichedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Company', companySchema);
