import mongoose, { Document, Schema } from 'mongoose';

export interface ITicketComment extends Document {
  _id: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  body: string;
  createdAt: Date;
}

const ticketCommentSchema = new Schema<ITicketComment>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ticketCommentSchema.index({ ticketId: 1, createdAt: -1 });

export const TicketComment = mongoose.model<ITicketComment>('TicketComment', ticketCommentSchema);
