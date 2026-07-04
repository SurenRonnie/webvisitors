import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { listLeadFeed, getCompanyProfile, addNote, updateTags } from '../controllers/companies.controller.js';

const router = Router();
router.use(requireAuth, tenantScope);

router.get('/feed', asyncHandler(listLeadFeed));
router.get('/visits/:visitId', asyncHandler(getCompanyProfile));
router.post('/visits/:visitId/notes', asyncHandler(addNote));
router.put('/visits/:visitId/tags', asyncHandler(updateTags));

export default router;
