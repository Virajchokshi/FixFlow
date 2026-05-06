import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType = 'ticket_status' | 'ticket_assigned' | 'ticket_comment';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  ticketId?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['ticket_status', 'ticket_assigned', 'ticket_comment'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = model<INotification>('Notification', notificationSchema);
