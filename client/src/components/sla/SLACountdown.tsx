import { useState, useEffect } from 'react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SLAStatus } from '@/types';

interface SLACountdownProps {
  deadline?: string;
  slaStatus: SLAStatus;
  className?: string;
}

export function SLACountdown({ deadline, slaStatus, className }: SLACountdownProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) {
    return <span className="text-xs text-fixflow-muted">No SLA policy</span>;
  }

  const deadlineDate = new Date(deadline);
  const isOverdue = isPast(deadlineDate);

  const colorClass =
    slaStatus === 'breached' || isOverdue
      ? 'text-red-600'
      : slaStatus === 'at_risk'
        ? 'text-amber-600'
        : 'text-green-600';

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', colorClass, className)}>
      <Clock className="h-3.5 w-3.5" />
      {isOverdue
        ? `Overdue by ${formatDistanceToNow(deadlineDate)}`
        : `${formatDistanceToNow(deadlineDate)} remaining`}
    </span>
  );
}
