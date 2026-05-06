import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validateBody';
import { authenticate } from '../middleware/authenticate';
import { registerSchema, loginSchema } from '../validations/auth.validation';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, getMe);
router.post('/logout', logout);

export default router;
