import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import {
  getAccount,
  updateAccount,
  listTeam,
  inviteTeamMember,
  requestAccountDeletion,
} from '../controllers/account.controller.js';

const router = Router();
router.use(requireAuth, tenantScope);

router.get('/', asyncHandler(getAccount));
router.put('/', requireRole('admin'), asyncHandler(updateAccount));
router.get('/team', asyncHandler(listTeam));
router.post('/team', requireRole('admin'), asyncHandler(inviteTeamMember));
router.post('/gdpr/delete', requireRole('admin'), asyncHandler(requestAccountDeletion));

export default router;
