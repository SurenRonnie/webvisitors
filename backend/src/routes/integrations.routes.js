import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import {
  listIntegrations,
  connectCrm,
  disconnectIntegration,
  setWebhookIntegration,
  pushVisitToCrm,
} from '../controllers/integrations.controller.js';

const router = Router();
router.use(requireAuth, tenantScope);

router.get('/', asyncHandler(listIntegrations));
router.post('/crm/:provider/connect', asyncHandler(connectCrm));
router.post('/crm/:provider/push', asyncHandler(pushVisitToCrm));
router.post('/webhook/:provider', asyncHandler(setWebhookIntegration));
router.delete('/:provider', asyncHandler(disconnectIntegration));

export default router;
