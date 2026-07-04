import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { getPlans, startCheckout, setPlan } from '../controllers/billing.controller.js';

const router = Router();
router.use(requireAuth, tenantScope);

router.get('/plans', asyncHandler(getPlans));
router.post('/checkout', asyncHandler(startCheckout));
router.post('/set-plan', asyncHandler(setPlan));

export default router;
