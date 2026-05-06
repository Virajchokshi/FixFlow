import { Ticket, AlertTriangle, Users, DollarSign, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TicketStatusChart } from '@/components/dashboard/TicketStatusChart';
import { FinancialSummary } from '@/components/dashboard/FinancialSummary';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuthContext } from '@/context/AuthContext';

export function AdminDashboard() {
  const { data, isLoading } = useDashboardSummary();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const metrics = data?.data.metrics;
  const statusDistribution = data?.data.statusDistribution ?? {};
  const slaDistribution = data?.data.slaDistribution ?? {};

  const slaOnTrack = slaDistribution['on_track'] ?? 0;
  const slaAtRisk = slaDistribution['at_risk'] ?? 0;
  const slaBreached = slaDistribution['breached'] ?? 0;
  const totalOpen = slaOnTrack + slaAtRisk + slaBreached;
  const slaCompliancePct = totalOpen > 0
    ? Math.round((slaOnTrack / totalOpen) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${getTimeOfDay()}, ${user?.name?.split(' ')[0]}`}
        subtitle="Here's what's happening across your system today."
      />

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tickets"
          value={metrics?.totalTickets ?? 0}
          trend={metrics?.ticketTrend}
          icon={<Ticket className="h-5 w-5" />}
          iconColor="bg-indigo-50 text-indigo-600"
          onClick={() => navigate('/tickets')}
        />
        <MetricCard
          title="Open Tickets"
          value={metrics?.openTickets ?? 0}
          subtitle="Awaiting resolution"
          icon={<Clock className="h-5 w-5" />}
          iconColor="bg-amber-50 text-amber-600"
          onClick={() => navigate('/tickets?status=IN_PROGRESS')}
        />
        <MetricCard
          title="SLA Compliance"
          value={`${slaCompliancePct}%`}
          subtitle={`${slaBreached} breached`}
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor={slaBreached > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}
          onClick={() => navigate('/admin/sla')}
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics?.totalRevenue ?? 0)}
          subtitle={`${metrics?.closedTickets ?? 0} closed tickets`}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="bg-green-50 text-green-600"
          onClick={() => navigate('/finance/invoices')}
        />
      </div>

      {/* Secondary info strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatStrip label="Active Users" value={metrics?.totalUsers ?? 0} color="text-indigo-600" onClick={() => navigate('/admin/users')} />
        <StatStrip label="Closed" value={metrics?.closedTickets ?? 0} color="text-green-600" onClick={() => navigate('/tickets?status=CLOSED')} />
        <StatStrip label="SLA On Track" value={slaOnTrack} color="text-green-600" onClick={() => navigate('/tickets?slaStatus=on_track')} />
        <StatStrip label="SLA At Risk" value={slaAtRisk} color="text-amber-600" onClick={() => navigate('/tickets?slaStatus=at_risk')} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TicketStatusChart distribution={statusDistribution} />
        <FinancialSummary
          totalRevenue={metrics?.totalRevenue ?? 0}
          openTickets={metrics?.openTickets ?? 0}
          closedTickets={metrics?.closedTickets ?? 0}
        />
      </div>
    </div>
  );
}

function StatStrip({ label, value, color, onClick }: { label: string; value: number; color: string; onClick?: () => void }) {
  return (
    <Card className={cn('rounded-xl shadow-none border', onClick && 'cursor-pointer hover:shadow-md transition-shadow')} onClick={onClick}>
      <CardContent className="p-4">
        <p className="text-xs text-fixflow-muted font-medium">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
