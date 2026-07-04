import mongoose from 'mongoose';

const pageViewSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    url: { type: String, required: true },
    path: { type: String, required: true },
    title: { type: String },
    timeOnPageSeconds: { type: Number, default: 0 },
    viewedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

pageViewSchema.index({ session: 1, viewedAt: 1 });

export default mongoose.model('PageView', pageViewSchema);
