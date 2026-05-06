import { Router } from 'express';
import {
  listSLAPolicies,
  createSLAPolicy,
  updateSLAPolicy,
  triggerSweep,
} from '../controllers/sla.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateBody';
import { createSLAPolicySchema, updateSLAPolicySchema } from '../validations/sla.validation';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', listSLAPolicies);
router.post('/', validateBody(createSLAPolicySchema), createSLAPolicy);
router.patch('/:id', validateBody(updateSLAPolicySchema), updateSLAPolicy);
router.post('/trigger-sweep', triggerSweep);

export default router;
