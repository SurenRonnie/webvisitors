import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { listWebsites, createWebsite, getInstallStatus } from '../controllers/websites.controller.js';

const router = Router();
router.use(requireAuth, tenantScope);

router.get('/', asyncHandler(listWebsites));
router.post('/', asyncHandler(createWebsite));
router.get('/:id/install-status', asyncHandler(getInstallStatus));

export default router;
