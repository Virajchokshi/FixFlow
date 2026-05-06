import { Router } from 'express';
import { listNotifications, markAllRead } from '../controllers/notification.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.get('/', listNotifications);
router.patch('/read-all', markAllRead);

export default router;
