import { Schema, model, Document, Types } from 'mongoose';

export interface IFeedback extends Document {
  ticketId: Types.ObjectId;
  submittedBy: Types.ObjectId;
  technicianId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, unique: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    technicianId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Feedback = model<IFeedback>('Feedback', feedbackSchema);
