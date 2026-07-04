import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import {
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  listScoringRules,
  upsertScoringRules,
} from '../controllers/alerts.controller.js';

const router = Router();
router.use(requireAuth, tenantScope);

// Registered before the /:id routes so "scoring-rules" isn't swallowed as an :id param.
router.get('/scoring-rules', asyncHandler(listScoringRules));
router.put('/scoring-rules', asyncHandler(upsertScoringRules));

router.get('/', asyncHandler(listAlertRules));
router.post('/', asyncHandler(createAlertRule));
router.put('/:id', asyncHandler(updateAlertRule));
router.delete('/:id', asyncHandler(deleteAlertRule));

export default router;
