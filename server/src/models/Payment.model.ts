import mongoose, { Document, Schema } from 'mongoose';

export type PaymentMethod = 'bank_transfer' | 'cash' | 'card' | 'cheque';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string;
  paymentDate: Date;
  outstandingBalance: number;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['bank_transfer', 'cash', 'card', 'cheque'],
      required: true,
    },
    referenceNumber: { type: String, required: true, trim: true },
    paymentDate: { type: Date, required: true },
    outstandingBalance: { type: Number, required: true, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

paymentSchema.index({ invoiceId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
