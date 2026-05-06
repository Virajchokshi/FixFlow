import { Router } from 'express';
import {
  listUsers,
  getUser,
  updateUser,
  updateUserRole,
  deactivateUser,
  activateUser,
  deleteUser,
  createUser,
  listTechnicians,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin'), listUsers);
router.post('/', authorize('admin'), createUser);
router.get('/technicians', authorize('admin'), listTechnicians);
router.get('/:id', authorize('admin'), getUser);
router.patch('/:id', authorize('admin'), updateUser);
router.patch('/:id/role', authorize('admin'), updateUserRole);
router.patch('/:id/deactivate', authorize('admin'), deactivateUser);
router.patch('/:id/activate', authorize('admin'), activateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
