import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'sales', 'viewer'], default: 'admin' },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
