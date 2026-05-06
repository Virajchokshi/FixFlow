import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog.model';

interface AuditEntryParams {
  ticketId: mongoose.Types.ObjectId | string;
  actorId: mongoose.Types.ObjectId | string;
  action: string;
  fromValue?: string;
  toValue?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditEntry(params: AuditEntryParams): Promise<void> {
  await AuditLog.create({
    ticketId: params.ticketId,
    actorId: params.actorId,
    action: params.action,
    fromValue: params.fromValue,
    toValue: params.toValue,
    metadata: params.metadata,
  });
}
