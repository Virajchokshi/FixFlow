import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: ReactNode;
  iconColor?: string;
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconColor = 'bg-blue-50 text-blue-600',
  className,
  onClick,
}: MetricCardProps) {
  const hasTrend = trend !== undefined;
  const isPositive = hasTrend && trend > 0;
  const isNegative = hasTrend && trend < 0;

  return (
    <Card
      className={cn('hover:shadow-md transition-shadow', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-fixflow-muted">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-fixflow-muted">{subtitle}</p>
            )}
            {hasTrend && (
              <div
                className={cn(
                  'mt-2 flex items-center gap-1 text-xs font-medium',
                  isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-fixflow-muted'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : isNegative ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5" />
                )}
                <span>
                  {isPositive ? '+' : ''}{trend.toFixed(1)}% vs last week
                </span>
              </div>
            )}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', iconColor)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
