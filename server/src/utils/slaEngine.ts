import { Ticket, SLAStatus, ITicket } from '../models/Ticket.model';
import { SLAPolicy, ISLAPolicy } from '../models/SLAPolicy.model';
import { createAuditEntry } from './auditLog';
import mongoose from 'mongoose';

const SYSTEM_ACTOR_ID = new mongoose.Types.ObjectId('000000000000000000000000');

const TERMINAL_STATUSES = ['CLOSED', 'REJECTED'];

export function computeSLAStatus(ticket: ITicket, policy: ISLAPolicy): SLAStatus {
  const elapsed = Date.now() - ticket.createdAt.getTime();
  const resolutionMs = policy.resolutionTimeHours * 3_600_000;

  if (elapsed > resolutionMs) return 'breached';
  if (elapsed > resolutionMs * 0.8) return 'at_risk';
  return 'on_track';
}

export async function sweepAllTickets(): Promise<{ processed: number; breached: number }> {
  const openTickets = await Ticket.find({
    status: { $nin: TERMINAL_STATUSES },
    slaPolicy: { $exists: true, $ne: null },
  }).lean();

  let breachedCount = 0;

  for (const ticket of openTickets) {
    const policy = await SLAPolicy.findById(ticket.slaPolicy).lean();
    if (!policy) continue;

    const newSlaStatus = computeSLAStatus(ticket as unknown as ITicket, policy as unknown as ISLAPolicy);
    const previousSlaStatus = ticket.slaStatus;

    await Ticket.findByIdAndUpdate(ticket._id, {
      slaStatus: newSlaStatus,
      ...(newSlaStatus === 'breached' && !ticket.slaDeadline ? {} : {}),
    });

    if (newSlaStatus === 'breached' && previousSlaStatus !== 'breached') {
      breachedCount++;
      await createAuditEntry({
        ticketId: ticket._id as mongoose.Types.ObjectId,
        actorId: SYSTEM_ACTOR_ID,
        action: 'SLA_BREACHED',
        fromValue: previousSlaStatus,
        toValue: 'breached',
        metadata: {
          policyId: policy._id,
          resolutionTimeHours: policy.resolutionTimeHours,
        },
      });
    }
  }

  return { processed: openTickets.length, breached: breachedCount };
}
