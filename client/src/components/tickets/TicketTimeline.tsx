import { formatDateTime } from '@/lib/utils';
import { AuditLog } from '@/types';
import { User } from 'lucide-react';

interface TicketTimelineProps {
  logs: AuditLog[];
}

const ACTION_LABELS: Record<string, string> = {
  TICKET_CREATED: 'Ticket created',
  STATUS_CHANGED: 'Status changed',
  ASSIGNED: 'Technician assigned',
  COMMENT_ADDED: 'Comment added',
  ATTACHMENT_ADDED: 'Attachment uploaded',
  SLA_BREACHED: 'SLA breached',
  ESTIMATE_CREATED: 'Estimate created',
  ESTIMATE_APPROVED: 'Estimate approved',
  ESTIMATE_REJECTED: 'Estimate rejected',
  INVOICE_CREATED: 'Invoice created',
  INVOICE_ISSUED: 'Invoice issued',
  PAYMENT_RECORDED: 'Payment recorded',
};

export function TicketTimeline({ logs }: TicketTimelineProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-fixflow-muted py-4">No activity recorded yet.</p>;
  }

  return (
    <ol className="relative border-l border-fixflow-border ml-3">
      {logs.map((log, index) => {
        const actor = typeof log.actorId === 'object' ? log.actorId : null;
        const actorName = actor ? (actor as any).name : 'System';

        return (
          <li key={log._id} className={`mb-6 ml-6 ${index === logs.length - 1 ? 'mb-0' : ''}`}>
            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white">
              <User className="h-3 w-3 text-blue-700" />
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {ACTION_LABELS[log.action] ?? log.action}
              </h3>
              {log.fromValue && log.toValue && (
                <span className="text-xs text-fixflow-muted">
                  {log.fromValue} → {log.toValue}
                </span>
              )}
            </div>
            <time className="mb-1 block text-xs font-normal leading-none text-fixflow-muted">
              {formatDateTime(log.createdAt)}
            </time>
            <p className="text-sm text-fixflow-muted">
              by <span className="font-medium">{actorName}</span>
              {log.metadata?.reason != null ? ` — "${String(log.metadata.reason)}"` : null}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
