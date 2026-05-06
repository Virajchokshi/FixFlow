import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Estimate } from '../models/Estimate.model';
import { EstimateItem } from '../models/EstimateItem.model';
import { Ticket } from '../models/Ticket.model';
import { generateAutoNumber } from '../utils/autoNumber';
import { createAuditEntry } from '../utils/auditLog';
import { ApiError } from '../utils/ApiError';

function calcTotals(items: Array<{ quantity: number; unitPrice: number; lineTotal: number }>, taxRate = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export async function listEstimates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, userId } = req.user!;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> =
      role === 'technician' ? { createdBy: new mongoose.Types.ObjectId(userId) } : {};

    const [estimates, total] = await Promise.all([
      Estimate.find(filter)
        .populate('ticketId', 'ticketNumber title priority')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Estimate.countDocuments(filter),
    ]);

    res.json({ success: true, data: estimates, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function createEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, userId } = req.user!;
    const { ticketId, items, notes, taxRate = 0 } = req.body as {
      ticketId: string;
      items: Array<{ type: string; description: string; quantity: number; unitPrice: number }>;
      notes?: string;
      taxRate?: number;
    };

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw ApiError.notFound('Ticket not found');

    // Technicians can only create estimates for their assigned tickets
    if (role === 'technician' && ticket.assignedTo?.toString() !== userId) {
      throw ApiError.forbidden('You can only create estimates for your assigned tickets');
    }

    const estimateNumber = await generateAutoNumber('EST');

    const lineItems = items.map((item) => ({
      ...item,
      lineTotal: item.quantity * item.unitPrice,
    }));

    const { subtotal, tax, total } = calcTotals(lineItems, taxRate);

    const estimate = await Estimate.create({
      estimateNumber,
      ticketId: new mongoose.Types.ObjectId(ticketId),
      createdBy: new mongoose.Types.ObjectId(req.user!.userId),
      subtotal,
      tax,
      total,
      notes,
    });

    await EstimateItem.insertMany(
      lineItems.map((item) => ({ ...item, estimateId: estimate._id }))
    );

    await createAuditEntry({
      ticketId: new mongoose.Types.ObjectId(ticketId),
      actorId: new mongoose.Types.ObjectId(req.user!.userId),
      action: 'ESTIMATE_CREATED',
      metadata: { estimateNumber, total },
    });

    const populated = await Estimate.findById(estimate._id)
      .populate('ticketId', 'ticketNumber title')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populated, message: 'Estimate created' });
  } catch (error) {
    next(error);
  }
}

export async function getEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const estimate = await Estimate.findById(req.params['id'])
      .populate('ticketId', 'ticketNumber title priority status')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!estimate) throw ApiError.notFound('Estimate not found');

    const items = await EstimateItem.find({ estimateId: estimate._id });

    res.json({ success: true, data: { ...estimate.toObject(), items } });
  } catch (error) {
    next(error);
  }
}

export async function updateEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, userId } = req.user!;
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (estimate.status !== 'draft' && estimate.status !== 'revision_requested') {
      throw ApiError.badRequest('Only draft or revision-requested estimates can be updated');
    }
    if (role === 'technician' && estimate.createdBy.toString() !== userId) {
      throw ApiError.forbidden('You can only update your own estimates');
    }

    const { notes, taxRate } = req.body as { notes?: string; taxRate?: number };

    if (taxRate !== undefined) {
      const items = await EstimateItem.find({ estimateId: estimate._id }).lean();
      const { subtotal, tax, total } = calcTotals(items, taxRate);
      estimate.subtotal = subtotal;
      estimate.tax = tax;
      estimate.total = total;
    }

    if (notes !== undefined) estimate.notes = notes;
    await estimate.save();

    res.json({ success: true, data: estimate });
  } catch (error) {
    next(error);
  }
}

export async function addEstimateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, userId } = req.user!;
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (estimate.status !== 'draft' && estimate.status !== 'revision_requested') {
      throw ApiError.badRequest('Only draft or revision-requested estimates can be modified');
    }
    if (role === 'technician' && estimate.createdBy.toString() !== userId) {
      throw ApiError.forbidden('You can only modify your own estimates');
    }

    const { type, description, quantity, unitPrice } = req.body as {
      type: string;
      description: string;
      quantity: number;
      unitPrice: number;
    };

    const lineTotal = quantity * unitPrice;
    const item = await EstimateItem.create({
      estimateId: estimate._id,
      type,
      description,
      quantity,
      unitPrice,
      lineTotal,
    });

    const allItems = await EstimateItem.find({ estimateId: estimate._id }).lean();
    const { subtotal, tax, total } = calcTotals(
      allItems,
      estimate.tax > 0 ? (estimate.tax / estimate.subtotal) * 100 : 0
    );

    estimate.subtotal = subtotal;
    estimate.tax = tax;
    estimate.total = total;
    await estimate.save();

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function updateEstimateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, userId } = req.user!;
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (estimate.status !== 'draft' && estimate.status !== 'revision_requested') {
      throw ApiError.badRequest('Only draft or revision-requested estimates can be modified');
    }
    if (role === 'technician' && estimate.createdBy.toString() !== userId) {
      throw ApiError.forbidden('You can only modify your own estimates');
    }

    const { type, description, quantity, unitPrice } = req.body as {
      type: string;
      description: string;
      quantity: number;
      unitPrice: number;
    };

    const lineTotal = quantity * unitPrice;

    const item = await EstimateItem.findOneAndUpdate(
      { _id: req.params['itemId'], estimateId: estimate._id },
      { type, description, quantity, unitPrice, lineTotal },
      { new: true, runValidators: true }
    );

    if (!item) throw ApiError.notFound('Item not found');

    const allItems = await EstimateItem.find({ estimateId: estimate._id }).lean();
    const taxRate = estimate.subtotal > 0 ? (estimate.tax / estimate.subtotal) * 100 : 0;
    const { subtotal, tax, total } = calcTotals(allItems, taxRate);
    estimate.subtotal = subtotal;
    estimate.tax = tax;
    estimate.total = total;
    await estimate.save();

    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteEstimateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, userId } = req.user!;
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (estimate.status !== 'draft' && estimate.status !== 'revision_requested') {
      throw ApiError.badRequest('Only draft or revision-requested estimates can be modified');
    }
    if (role === 'technician' && estimate.createdBy.toString() !== userId) {
      throw ApiError.forbidden('You can only modify your own estimates');
    }

    const item = await EstimateItem.findOneAndDelete({
      _id: req.params['itemId'],
      estimateId: estimate._id,
    });

    if (!item) throw ApiError.notFound('Item not found');

    const allItems = await EstimateItem.find({ estimateId: estimate._id }).lean();
    const { subtotal, tax, total } = calcTotals(
      allItems,
      estimate.subtotal > 0 ? (estimate.tax / estimate.subtotal) * 100 : 0
    );

    estimate.subtotal = subtotal;
    estimate.tax = tax;
    estimate.total = total;
    await estimate.save();

    res.json({ success: true, message: 'Item removed' });
  } catch (error) {
    next(error);
  }
}

export async function approveEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (estimate.status !== 'submitted' && estimate.status !== 'draft') {
      throw ApiError.badRequest('Estimate cannot be approved in its current state');
    }

    estimate.status = 'approved';
    estimate.approvedBy = new mongoose.Types.ObjectId(req.user!.userId);
    estimate.approvedAt = new Date();
    await estimate.save();

    await createAuditEntry({
      ticketId: estimate.ticketId,
      actorId: new mongoose.Types.ObjectId(req.user!.userId),
      action: 'ESTIMATE_APPROVED',
      metadata: { estimateId: estimate._id, total: estimate.total },
    });

    res.json({ success: true, data: estimate, message: 'Estimate approved' });
  } catch (error) {
    next(error);
  }
}

export async function rejectEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (!['submitted', 'revision_requested', 'draft'].includes(estimate.status)) {
      throw ApiError.badRequest('Estimate cannot be rejected in its current state');
    }

    estimate.status = 'rejected';
    await estimate.save();

    await createAuditEntry({
      ticketId: estimate.ticketId,
      actorId: new mongoose.Types.ObjectId(req.user!.userId),
      action: 'ESTIMATE_REJECTED',
      metadata: { estimateId: estimate._id, reason: req.body.reason },
    });

    res.json({ success: true, data: estimate, message: 'Estimate rejected' });
  } catch (error) {
    next(error);
  }
}

export async function submitEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!;
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (estimate.status !== 'draft' && estimate.status !== 'revision_requested') {
      throw ApiError.badRequest('Only draft or revision-requested estimates can be submitted');
    }
    if (estimate.createdBy.toString() !== userId) {
      throw ApiError.forbidden('You can only submit your own estimates');
    }

    estimate.status = 'submitted';
    estimate.revisionNotes = undefined;
    await estimate.save();

    await createAuditEntry({
      ticketId: estimate.ticketId,
      actorId: new mongoose.Types.ObjectId(userId),
      action: 'ESTIMATE_SUBMITTED',
      metadata: { estimateId: estimate._id, total: estimate.total },
    });

    const populated = await Estimate.findById(estimate._id)
      .populate('ticketId', 'ticketNumber title')
      .populate('createdBy', 'name email');

    res.json({ success: true, data: populated, message: 'Estimate submitted for review' });
  } catch (error) {
    next(error);
  }
}

export async function requestRevision(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!;
    const { notes } = req.body as { notes?: string };
    const estimate = await Estimate.findById(req.params['id']);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (estimate.status !== 'submitted') {
      throw ApiError.badRequest('Revision can only be requested on submitted estimates');
    }

    estimate.status = 'revision_requested';
    estimate.revisionNotes = notes;
    await estimate.save();

    await createAuditEntry({
      ticketId: estimate.ticketId,
      actorId: new mongoose.Types.ObjectId(userId),
      action: 'ESTIMATE_REVISION_REQUESTED',
      metadata: { estimateId: estimate._id, notes },
    });

    res.json({ success: true, data: estimate, message: 'Revision requested' });
  } catch (error) {
    next(error);
  }
}
