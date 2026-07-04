import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { getAttributionReport, getPipelineSummary } from '../controllers/reports.controller.js';

const router = Router();
router.use(requireAuth, tenantScope);

router.get('/attribution', asyncHandler(getAttributionReport));
router.get('/pipeline-summary', asyncHandler(getPipelineSummary));

export default router;
