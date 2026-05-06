import { Router } from 'express';
import { getAdminSummary, getTechnicianDashboard } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/summary', authorize('admin'), getAdminSummary);
router.get('/technician', authorize('admin', 'technician'), getTechnicianDashboard);

export default router;
