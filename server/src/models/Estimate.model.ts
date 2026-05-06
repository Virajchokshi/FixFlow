import mongoose, { Document, Schema } from 'mongoose';

export type EstimateStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'revision_requested';

export interface IEstimate extends Document {
  _id: mongoose.Types.ObjectId;
  estimateNumber: string;
  ticketId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: EstimateStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  revisionNotes?: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const estimateSchema = new Schema<IEstimate>(
  {
    estimateNumber: { type: String, required: true, unique: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'revision_requested'],
      default: 'draft',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    revisionNotes: { type: String, trim: true },
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

estimateSchema.index({ ticketId: 1 });
estimateSchema.index({ status: 1 });

export const Estimate = mongoose.model<IEstimate>('Estimate', estimateSchema);
