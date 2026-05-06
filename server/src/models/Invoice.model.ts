import mongoose, { Document, Schema } from 'mongoose';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partial';

export interface IInvoice extends Document {
  _id: mongoose.Types.ObjectId;
  invoiceNumber: string;
  ticketId: mongoose.Types.ObjectId;
  estimateId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  issuedAt?: Date;
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    estimateId: { type: Schema.Types.ObjectId, ref: 'Estimate' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'issued', 'paid', 'partial'],
      default: 'draft',
    },
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    issuedAt: { type: Date },
    dueDate: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

invoiceSchema.index({ ticketId: 1 });
invoiceSchema.index({ status: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
