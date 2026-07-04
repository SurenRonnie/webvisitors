import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ingestRateLimiter } from '../middleware/rateLimiter.js';
import { ingestHit } from '../controllers/ingest.controller.js';

const router = Router();

// Public endpoint — hit by tracker.js from customer websites, no auth (the trackingId is the credential).
router.post('/hit', ingestRateLimiter, asyncHandler(ingestHit));

export default router;
