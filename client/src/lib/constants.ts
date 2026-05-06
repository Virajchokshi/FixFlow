import { TicketStatus, TicketPriority, SLAStatus } from '@/types';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  SUBMITTED: 'bg-slate-100 text-slate-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  ASSIGNED: 'bg-violet-100 text-violet-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  ON_HOLD: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-teal-100 text-teal-700',
  CLOSED: 'bg-green-100 text-green-700',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-400 text-yellow-900',
  low: 'bg-slate-200 text-slate-600',
};

export const SLA_COLORS: Record<SLAStatus, string> = {
  on_track: 'text-green-600',
  at_risk: 'text-amber-600',
  breached: 'text-red-600',
};

export const CATEGORY_LABELS: Record<string, string> = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  structural: 'Structural',
  it: 'IT',
  other: 'Other',
};

export const ESTIMATE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  revision_requested: 'bg-amber-100 text-amber-700',
};

export const ESTIMATE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  revision_requested: 'Revision Requested',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  issued: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
};

/** Fixed tax rate applied to all estimates and invoices (percentage). */
export const TAX_RATE = 10;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  card: 'Card',
  cheque: 'Cheque',
};
