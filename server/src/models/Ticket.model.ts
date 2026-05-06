import mongoose, { Document, Schema } from 'mongoose';

export type TicketStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CLOSED';

export type TicketCategory = 'electrical' | 'plumbing' | 'hvac' | 'structural' | 'it' | 'other';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type SLAStatus = 'on_track' | 'at_risk' | 'breached';

export interface IAIAnalysis {
  category: string;
  severity: string;
  issueType: string;
  description: string;
  estimatedRepairTime: string;
  requiredTools: string[];
  safetyPrecautions: string[];
  confidence: number;
  analyzedAt: Date;
}

export interface ITicket extends Document {
  _id: mongoose.Types.ObjectId;
  ticketNumber: string;
  title: string;
  description: string;
  category: TicketCategory;
  customCategory?: string;
  priority: TicketPriority;
  location: string;
  status: TicketStatus;
  imageBase64: string;
  submittedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  slaPolicy?: mongoose.Types.ObjectId;
  slaDeadline?: Date;
  slaStatus: SLAStatus;
  closedAt?: Date;
  aiAnalysis?: IAIAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const ALL_STATUSES: TicketStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'CLOSED',
];

const ticketSchema = new Schema<ITicket>(
  {
    ticketNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['electrical', 'plumbing', 'hvac', 'structural', 'it', 'other'],
      required: true,
    },
    customCategory: { type: String, trim: true },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    location: { type: String, required: true, trim: true },
    imageBase64: { type: String, required: true },
    status: {
      type: String,
      enum: ALL_STATUSES,
      default: 'SUBMITTED',
    },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    slaPolicy: { type: Schema.Types.ObjectId, ref: 'SLAPolicy' },
    slaDeadline: { type: Date },
    slaStatus: {
      type: String,
      enum: ['on_track', 'at_risk', 'breached'],
      default: 'on_track',
    },
    closedAt: { type: Date },
    aiAnalysis: {
      category: String,
      severity: String,
      issueType: String,
      description: String,
      estimatedRepairTime: String,
      requiredTools: [String],
      safetyPrecautions: [String],
      confidence: Number,
      analyzedAt: Date,
    },
  },
  { timestamps: true }
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ submittedBy: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ slaStatus: 1 });

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
