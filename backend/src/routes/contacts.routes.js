import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { listContactsForCompany, refreshContacts } from '../controllers/contacts.controller.js';

const router = Router();
router.use(requireAuth, tenantScope);

router.get('/:companyId', asyncHandler(listContactsForCompany));
router.post('/:companyId/refresh', asyncHandler(refreshContacts));

export default router;
