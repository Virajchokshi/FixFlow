import mongoose, { Document, Schema } from 'mongoose';

export interface ITicketAttachment extends Document {
  _id: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  storagePath: string;
  createdAt: Date;
}

const ticketAttachmentSchema = new Schema<ITicketAttachment>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    storagePath: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ticketAttachmentSchema.index({ ticketId: 1 });

export const TicketAttachment = mongoose.model<ITicketAttachment>(
  'TicketAttachment',
  ticketAttachmentSchema
);
