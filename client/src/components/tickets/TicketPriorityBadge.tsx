import { TicketPriority } from '@/types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

export function TicketPriorityBadge({ priority, className }: TicketPriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        PRIORITY_COLORS[priority],
        className
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
