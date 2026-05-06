import { Router } from 'express';
import {
  listTickets,
  createTicket,
  getTicket,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
  assignTicket,
  setPriority,
  listComments,
  addComment,
  deleteComment,
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  getTicketAudit,
} from '../controllers/ticket.controller';
import { submitFeedback, getFeedback } from '../controllers/feedback.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateBody';
import { upload } from '../middleware/upload';
import {
  createTicketSchema,
  updateTicketSchema,
  updateStatusSchema,
  assignTicketSchema,
  addCommentSchema,
  setPrioritySchema,
} from '../validations/ticket.validation';
import { submitFeedbackSchema } from '../validations/feedback.validation';

const router = Router();

router.use(authenticate);

router.get('/', listTickets);
router.post('/', authorize('admin', 'user'), validateBody(createTicketSchema), createTicket);
router.get('/:id', getTicket);
router.patch('/:id', authorize('admin'), validateBody(updateTicketSchema), updateTicket);
router.delete('/:id', deleteTicket);
router.patch('/:id/status', validateBody(updateStatusSchema), updateTicketStatus);
router.post('/:id/assign', authorize('admin'), validateBody(assignTicketSchema), assignTicket);
router.patch('/:id/priority', authorize('admin'), validateBody(setPrioritySchema), setPriority);

// Comments
router.get('/:id/comments', listComments);
router.post('/:id/comments', validateBody(addCommentSchema), addComment);
router.delete('/:id/comments/:commentId', deleteComment);

// Attachments
router.get('/:id/attachments', listAttachments);
router.post('/:id/attachments', upload.single('file'), uploadAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

// Audit
router.get('/:id/audit', authorize('admin'), getTicketAudit);

// Feedback
router.get('/:id/feedback', getFeedback);
router.post('/:id/feedback', validateBody(submitFeedbackSchema), submitFeedback);

export default router;
