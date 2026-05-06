import { Router } from 'express';
import {
  listInvoices,
  createInvoice,
  getInvoice,
  updateInvoice,
  issueInvoice,
  convertFromEstimate,
} from '../controllers/invoice.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateBody';
import { createInvoiceSchema, updateInvoiceSchema } from '../validations/invoice.validation';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', listInvoices);
router.post('/', validateBody(createInvoiceSchema), createInvoice);
router.get('/:id', getInvoice);
router.patch('/:id', validateBody(updateInvoiceSchema), updateInvoice);
router.patch('/:id/issue', issueInvoice);
router.post('/from-estimate/:estimateId', convertFromEstimate);

export default router;
