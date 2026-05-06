import { TicketStatus } from '../models/Ticket.model';
import { UserRole } from '../models/User.model';

/**
 * Simplified ticket lifecycle:
 *
 *   SUBMITTED → UNDER_REVIEW → APPROVED → ASSIGNED → IN_PROGRESS → COMPLETED → CLOSED
 *                             → REJECTED
 *                                  IN_PROGRESS ↔ ON_HOLD
 *                                  COMPLETED → IN_PROGRESS  (rework)
 */

interface TransitionAction {
  to: TicketStatus;
  roles: UserRole[];
  label: string;
  variant: 'default' | 'destructive' | 'outline';
}

type TransitionMap = Partial<Record<TicketStatus, TransitionAction[]>>;

export const TRANSITION_MAP: TransitionMap = {
  SUBMITTED: [
    { to: 'UNDER_REVIEW', roles: ['admin'], label: 'Start Review', variant: 'default' },
    { to: 'REJECTED', roles: ['admin'], label: 'Reject', variant: 'destructive' },
  ],
  UNDER_REVIEW: [
    { to: 'APPROVED', roles: ['admin'], label: 'Approve', variant: 'default' },
    { to: 'REJECTED', roles: ['admin'], label: 'Reject', variant: 'destructive' },
  ],
  ASSIGNED: [
    { to: 'IN_PROGRESS', roles: ['technician'], label: 'Begin Work', variant: 'default' },
  ],
  IN_PROGRESS: [
    { to: 'ON_HOLD', roles: ['technician', 'admin'], label: 'Put On Hold', variant: 'outline' },
    { to: 'COMPLETED', roles: ['technician', 'admin'], label: 'Mark Completed', variant: 'default' },
  ],
  ON_HOLD: [
    { to: 'IN_PROGRESS', roles: ['technician', 'admin'], label: 'Resume Work', variant: 'default' },
  ],
  COMPLETED: [
    { to: 'CLOSED', roles: ['admin'], label: 'Close Ticket', variant: 'default' },
    { to: 'IN_PROGRESS', roles: ['admin'], label: 'Send Back for Rework', variant: 'outline' },
  ],
};

/** The ordered pipeline stages for the step tracker (excludes REJECTED and ON_HOLD). */
export const PIPELINE_STAGES: TicketStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CLOSED',
];

export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateTransition(
  fromStatus: TicketStatus,
  toStatus: TicketStatus,
  role: UserRole
): TransitionValidationResult {
  const actions = TRANSITION_MAP[fromStatus];

  if (!actions || actions.length === 0) {
    return { valid: false, reason: `No transitions allowed from status '${fromStatus}'` };
  }

  const matchingAction = actions.find((a) => a.to === toStatus);

  if (!matchingAction) {
    return {
      valid: false,
      reason: `Transition from '${fromStatus}' to '${toStatus}' is not allowed`,
    };
  }

  if (!matchingAction.roles.includes(role)) {
    return {
      valid: false,
      reason: `Role '${role}' is not authorized for this transition`,
    };
  }

  return { valid: true };
}

export interface TransitionActionForClient {
  to: TicketStatus;
  label: string;
  variant: 'default' | 'destructive' | 'outline';
}

export function getValidTransitions(
  fromStatus: TicketStatus,
  role: UserRole
): TransitionActionForClient[] {
  const actions = TRANSITION_MAP[fromStatus];
  if (!actions) return [];

  return actions
    .filter((a) => a.roles.includes(role))
    .map(({ to, label, variant }) => ({ to, label, variant }));
}
