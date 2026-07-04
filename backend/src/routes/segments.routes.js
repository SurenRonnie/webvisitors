import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { listSegments, createSegment, updateSegment, deleteSegment } from '../controllers/segments.controller.js';

const router = Router();
router.use(requireAuth, tenantScope);

router.get('/', asyncHandler(listSegments));
router.post('/', asyncHandler(createSegment));
router.put('/:id', asyncHandler(updateSegment));
router.delete('/:id', asyncHandler(deleteSegment));

export default router;
