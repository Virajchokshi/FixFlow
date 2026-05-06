import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Feedback } from '../models/Feedback.model';
import { Ticket } from '../models/Ticket.model';
import { ApiError } from '../utils/ApiError';

export async function submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { userId } = req.user!;
    const { rating, comment } = req.body as { rating: number; comment?: string };

    const ticket = await Ticket.findById(id);
    if (!ticket) throw ApiError.notFound('Ticket not found');
    if (ticket.status !== 'CLOSED') throw ApiError.badRequest('Feedback can only be submitted for closed tickets');

    const submittedById = new mongoose.Types.ObjectId(userId);
    if (!ticket.submittedBy.equals(submittedById)) {
      throw ApiError.forbidden('Only the ticket submitter can leave feedback');
    }
    if (!ticket.assignedTo) throw ApiError.badRequest('No technician was assigned to this ticket');

    const existing = await Feedback.findOne({ ticketId: id });
    if (existing) throw ApiError.conflict('Feedback already submitted for this ticket');

    const feedback = await Feedback.create({
      ticketId: new mongoose.Types.ObjectId(id),
      submittedBy: submittedById,
      technicianId: ticket.assignedTo,
      rating,
      comment: comment || undefined,
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
}

export async function getFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findOne({ ticketId: id })
      .populate('submittedBy', 'name')
      .populate('technicianId', 'name');
    res.json({ success: true, data: feedback ?? null });
  } catch (error) {
    next(error);
  }
}
