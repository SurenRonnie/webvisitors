import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { signup, login, me } from '../controllers/auth.controller.js';

const router = Router();

router.post('/signup', authRateLimiter, asyncHandler(signup));
router.post('/login', authRateLimiter, asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));

export default router;
