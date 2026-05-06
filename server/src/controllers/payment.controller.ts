import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Payment } from '../models/Payment.model';
import { Invoice } from '../models/Invoice.model';
import { createAuditEntry } from '../utils/auditLog';
import { ApiError } from '../utils/ApiError';

export async function listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find()
        .populate('invoiceId', 'invoiceNumber total status')
        .populate('recordedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Payment.countDocuments(),
    ]);

    res.json({ success: true, data: payments, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { invoiceId, amount, method, referenceNumber, paymentDate } = req.body as {
      invoiceId: string;
      amount: number;
      method: string;
      referenceNumber: string;
      paymentDate: string;
    };

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw ApiError.notFound('Invoice not found');

    if (invoice.status === 'paid') {
      throw ApiError.badRequest('Invoice is already fully paid');
    }

    const previousPayments = await Payment.aggregate([
      { $match: { invoiceId: invoice._id } },
      { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
    ]);

    const totalPaid = previousPayments[0]?.totalPaid ?? 0;
    const outstandingBalance = Math.max(0, invoice.total - totalPaid - amount);

    const payment = await Payment.create({
      invoiceId: new mongoose.Types.ObjectId(invoiceId),
      recordedBy: new mongoose.Types.ObjectId(req.user!.userId),
      amount,
      method,
      referenceNumber,
      paymentDate: new Date(paymentDate),
      outstandingBalance,
    });

    // Update invoice status
    if (outstandingBalance <= 0) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
    } else {
      invoice.status = 'partial';
    }
    await invoice.save();

    await createAuditEntry({
      ticketId: invoice.ticketId,
      actorId: new mongoose.Types.ObjectId(req.user!.userId),
      action: 'PAYMENT_RECORDED',
      metadata: { amount, method, outstandingBalance, invoiceId },
    });

    const populated = await Payment.findById(payment._id)
      .populate('invoiceId', 'invoiceNumber total')
      .populate('recordedBy', 'name email');

    res.status(201).json({ success: true, data: populated, message: 'Payment recorded' });
  } catch (error) {
    next(error);
  }
}

export async function getPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payment = await Payment.findById(req.params['id'])
      .populate('invoiceId', 'invoiceNumber total status')
      .populate('recordedBy', 'name email');

    if (!payment) throw ApiError.notFound('Payment not found');

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}
