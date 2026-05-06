import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.model';
import { Estimate } from '../models/Estimate.model';
import { EstimateItem } from '../models/EstimateItem.model';
import { Ticket } from '../models/Ticket.model';
import { generateAutoNumber } from '../utils/autoNumber';
import { createAuditEntry } from '../utils/auditLog';
import { ApiError } from '../utils/ApiError';

export async function listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find()
        .populate('ticketId', 'ticketNumber title')
        .populate('estimateId', 'estimateNumber total')
        .populate('createdBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Invoice.countDocuments(),
    ]);

    res.json({ success: true, data: invoices, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketId, estimateId, dueDate, taxRate = 0 } = req.body as {
      ticketId: string;
      estimateId?: string;
      dueDate?: string;
      taxRate?: number;
    };

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw ApiError.notFound('Ticket not found');

    const invoiceNumber = await generateAutoNumber('INV');

    let subtotal = 0;
    let tax = 0;
    let total = 0;

    if (estimateId) {
      const estimate = await Estimate.findById(estimateId);
      if (!estimate) throw ApiError.notFound('Estimate not found');
      if (estimate.status !== 'approved') {
        throw ApiError.badRequest('Only approved estimates can be invoiced');
      }
      subtotal = estimate.subtotal;
      tax = estimate.tax;
      total = estimate.total;
    } else {
      const items = await EstimateItem.find({ estimateId: { $exists: false } });
      subtotal = 0;
      tax = subtotal * (taxRate / 100);
      total = subtotal + tax;
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      ticketId: new mongoose.Types.ObjectId(ticketId),
      estimateId: estimateId ? new mongoose.Types.ObjectId(estimateId) : undefined,
      createdBy: new mongoose.Types.ObjectId(req.user!.userId),
      subtotal,
      tax,
      total,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    await createAuditEntry({
      ticketId: new mongoose.Types.ObjectId(ticketId),
      actorId: new mongoose.Types.ObjectId(req.user!.userId),
      action: 'INVOICE_CREATED',
      metadata: { invoiceNumber, total },
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('ticketId', 'ticketNumber title')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populated, message: 'Invoice created' });
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await Invoice.findById(req.params['id'])
      .populate('ticketId', 'ticketNumber title priority status')
      .populate('estimateId', 'estimateNumber total')
      .populate('createdBy', 'name email');

    if (!invoice) throw ApiError.notFound('Invoice not found');

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
}

export async function updateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await Invoice.findById(req.params['id']);
    if (!invoice) throw ApiError.notFound('Invoice not found');
    if (invoice.status !== 'draft') throw ApiError.badRequest('Only draft invoices can be updated');

    const { dueDate, notes } = req.body as { dueDate?: string; notes?: string };

    if (dueDate) invoice.dueDate = new Date(dueDate);
    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
}

export async function issueInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await Invoice.findById(req.params['id']);
    if (!invoice) throw ApiError.notFound('Invoice not found');
    if (invoice.status !== 'draft') throw ApiError.badRequest('Only draft invoices can be issued');

    invoice.status = 'issued';
    invoice.issuedAt = new Date();
    await invoice.save();

    await createAuditEntry({
      ticketId: invoice.ticketId,
      actorId: new mongoose.Types.ObjectId(req.user!.userId),
      action: 'INVOICE_ISSUED',
      metadata: { invoiceId: invoice._id, total: invoice.total },
    });

    res.json({ success: true, data: invoice, message: 'Invoice issued' });
  } catch (error) {
    next(error);
  }
}

export async function convertFromEstimate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { estimateId } = req.params;
    const { dueDate } = req.body as { dueDate?: string };
    const { userId } = req.user!;

    const estimate = await Estimate.findById(estimateId);
    if (!estimate) throw ApiError.notFound('Estimate not found');
    if (estimate.status !== 'approved') {
      throw ApiError.badRequest('Only approved estimates can be converted to invoices');
    }

    const existing = await Invoice.findOne({ estimateId: estimate._id });
    if (existing) {
      throw ApiError.conflict(`Invoice ${existing.invoiceNumber} already exists for this estimate`);
    }

    const invoiceNumber = await generateAutoNumber('INV');

    const invoice = await Invoice.create({
      invoiceNumber,
      ticketId: estimate.ticketId,
      estimateId: estimate._id,
      createdBy: new mongoose.Types.ObjectId(userId),
      subtotal: estimate.subtotal,
      tax: estimate.tax,
      total: estimate.total,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    await createAuditEntry({
      ticketId: estimate.ticketId,
      actorId: new mongoose.Types.ObjectId(userId),
      action: 'INVOICE_CREATED',
      metadata: { invoiceNumber, estimateId, total: estimate.total },
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('ticketId', 'ticketNumber title')
      .populate('estimateId', 'estimateNumber total')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populated, message: 'Invoice created from estimate' });
  } catch (error) {
    next(error);
  }
}
