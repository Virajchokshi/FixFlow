import { Router } from 'express';
import { analyzeImage } from '../controllers/ai.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);
router.post('/analyze-image', analyzeImage);

export default router;
