import { DollarSign, FileText, Receipt, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TicketStatusChart } from '@/components/dashboard/TicketStatusChart';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/utils';

export function FinanceDashboard() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const metrics = data?.data.metrics;
  const statusDistribution = data?.data.statusDistribution ?? {};

  return (
    <div className="space-y-6">
      <PageHeader title="Finance Dashboard" subtitle="Financial overview and ticket pipeline" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics?.totalRevenue ?? 0)}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="bg-green-50 text-green-600"
        />
        <MetricCard
          title="In Progress"
          value={statusDistribution['IN_PROGRESS'] ?? 0}
          subtitle="Active work"
          icon={<FileText className="h-5 w-5" />}
          iconColor="bg-yellow-50 text-yellow-600"
        />
        <MetricCard
          title="Completed"
          value={statusDistribution['COMPLETED'] ?? 0}
          subtitle="Awaiting closure"
          icon={<Receipt className="h-5 w-5" />}
          iconColor="bg-indigo-50 text-indigo-600"
        />
        <MetricCard
          title="Closed"
          value={statusDistribution['CLOSED'] ?? 0}
          subtitle="Resolved tickets"
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="max-w-lg mx-auto">
        <TicketStatusChart distribution={statusDistribution} />
      </div>
    </div>
  );
}
