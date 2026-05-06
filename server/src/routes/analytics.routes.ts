import { Router } from 'express';
import { getAnalytics } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.get('/', authorize('admin'), getAnalytics);

export default router;
