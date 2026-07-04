import mongoose from 'mongoose';
import { env } from './env.js';

let connected = false;

export async function connectDb() {
  if (connected) return mongoose.connection;
  await mongoose.connect(env.mongodbUri);
  connected = true;
  console.log(`[db] connected to MongoDB at ${env.mongodbUri}`);
  return mongoose.connection;
}
