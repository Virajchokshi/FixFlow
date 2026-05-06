import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { SLAStatus } from '@/types';
import { cn } from '@/lib/utils';

interface SLABadgeProps {
  status: SLAStatus;
  className?: string;
}

const SLA_CONFIG = {
  on_track: {
    label: 'On Track',
    icon: CheckCircle,
    className: 'text-green-600',
  },
  at_risk: {
    label: 'At Risk',
    icon: AlertTriangle,
    className: 'text-amber-600 animate-pulse-amber',
  },
  breached: {
    label: 'Breached',
    icon: XCircle,
    className: 'text-red-600 animate-shake',
  },
};

export function SLABadge({ status, className }: SLABadgeProps) {
  const config = SLA_CONFIG[status] ?? SLA_CONFIG['on_track'];
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', config.className, className)}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
