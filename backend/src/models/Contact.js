import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true },
    title: { type: String },
    email: { type: String },
    emailConfidence: { type: Number, min: 0, max: 100 },
    linkedinUrl: { type: String },
    source: { type: String, enum: ['own_dataset', 'mock', 'manual'], default: 'mock' },
  },
  { timestamps: true }
);

export default mongoose.model('Contact', contactSchema);
