import mongoose, { Document, Schema } from 'mongoose';

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ISLAPolicy extends Document {
  _id: mongoose.Types.ObjectId;
  priority: TicketPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
  createdBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const slaPolicySchema = new Schema<ISLAPolicy>(
  {
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
      unique: true,
    },
    responseTimeHours: { type: Number, required: true, min: 1 },
    resolutionTimeHours: { type: Number, required: true, min: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const SLAPolicy = mongoose.model<ISLAPolicy>('SLAPolicy', slaPolicySchema);
