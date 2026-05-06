import { Router } from 'express';
import {
  listEstimates,
  createEstimate,
  getEstimate,
  updateEstimate,
  addEstimateItem,
  updateEstimateItem,
  deleteEstimateItem,
  approveEstimate,
  rejectEstimate,
  submitEstimate,
  requestRevision,
} from '../controllers/estimate.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateBody';
import {
  createEstimateSchema,
  updateEstimateSchema,
  addEstimateItemSchema,
  approveRejectEstimateSchema,
  requestRevisionSchema,
} from '../validations/estimate.validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin', 'technician'), listEstimates);
router.post('/', authorize('admin', 'technician'), validateBody(createEstimateSchema), createEstimate);
router.get('/:id', authorize('admin', 'technician'), getEstimate);
router.patch('/:id', authorize('admin', 'technician'), validateBody(updateEstimateSchema), updateEstimate);
router.post('/:id/items', authorize('admin', 'technician'), validateBody(addEstimateItemSchema), addEstimateItem);
router.patch('/:id/items/:itemId', authorize('admin', 'technician'), validateBody(addEstimateItemSchema), updateEstimateItem);
router.delete('/:id/items/:itemId', authorize('admin', 'technician'), deleteEstimateItem);
router.patch('/:id/submit', authorize('admin', 'technician'), submitEstimate);
router.patch('/:id/approve', authorize('admin'), validateBody(approveRejectEstimateSchema), approveEstimate);
router.patch('/:id/reject', authorize('admin'), validateBody(approveRejectEstimateSchema), rejectEstimate);
router.patch('/:id/request-revision', authorize('admin'), validateBody(requestRevisionSchema), requestRevision);

export default router;
