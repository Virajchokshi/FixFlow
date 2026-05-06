import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { CATEGORY_LABELS, PRIORITY_COLORS, STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

const STATUS_CHART_COLORS: Record<string, string> = {
  SUBMITTED: '#94a3b8',
  UNDER_REVIEW: '#f59e0b',
  APPROVED: '#22c55e',
  ASSIGNED: '#6366f1',
  IN_PROGRESS: '#3b82f6',
  ON_HOLD: '#f97316',
  COMPLETED: '#10b981',
  CLOSED: '#64748b',
  REJECTED: '#ef4444',
};

const SLA_KEY_MAP: Record<string, string> = {
  'On Track': 'on_track',
  'At Risk': 'at_risk',
  'Breached': 'breached',
};

function SLADonut({
  breakdown,
  onSliceClick,
}: {
  breakdown: { on_track: number; at_risk: number; breached: number };
  onSliceClick?: (slaStatus: string) => void;
}) {
  const data = [
    { name: 'On Track', value: breakdown.on_track, color: '#22c55e' },
    { name: 'At Risk', value: breakdown.at_risk, color: '#f59e0b' },
    { name: 'Breached', value: breakdown.breached, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No open tickets</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          dataKey="value"
          paddingAngle={3}
          onClick={(entry) => onSliceClick?.(SLA_KEY_MAP[entry.name] ?? entry.name)}
          style={{ cursor: onSliceClick ? 'pointer' : undefined }}
        >
          {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
        </Pie>
        <Tooltip formatter={(v: number) => [v, 'Tickets']} />
        <Legend iconType="circle" iconSize={10} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-xs text-slate-400">—</span>;
  return (
    <div className="flex items-center gap-1">
      <span className="text-amber-400 text-sm">★</span>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

export function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  const analytics = data?.data;
  if (!analytics) return null;

  const categoryData = analytics.byCategory.map((d) => ({
    name: CATEGORY_LABELS[d.category as keyof typeof CATEGORY_LABELS] ?? d.category,
    count: d.count,
    category: d.category,
  }));

  const statusData = analytics.byStatus.map((d) => ({
    name: STATUS_LABELS[d.status as keyof typeof STATUS_LABELS] ?? d.status,
    count: d.count,
    color: STATUS_CHART_COLORS[d.status] ?? '#94a3b8',
  }));

  const trendData = analytics.dailyTrend.map((d) => ({
    date: d.date.slice(5),
    count: d.count,
  }));

  const resolutionData = analytics.resolutionTime.map((d) => ({
    name: CATEGORY_LABELS[d.category as keyof typeof CATEGORY_LABELS] ?? d.category,
    hours: d.avgHours,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="System-wide performance overview" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tickets')}>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-fixflow-muted uppercase tracking-wide">Total Tickets</p>
            <p className="text-3xl font-bold mt-1">{analytics.summary.totalTickets}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tickets?status=IN_PROGRESS')}>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-fixflow-muted uppercase tracking-wide">Open Tickets</p>
            <p className="text-3xl font-bold mt-1 text-fixflow-primary">{analytics.summary.openTickets}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tickets?slaStatus=breached')}>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-fixflow-muted uppercase tracking-wide">SLA Breached</p>
            <p className="text-3xl font-bold mt-1 text-destructive">{analytics.slaBreakdown.breached}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/users')}>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-fixflow-muted uppercase tracking-wide">Technicians Rated</p>
            <p className="text-3xl font-bold mt-1">
              {analytics.technicianPerformance.filter((t) => t.ratingCount > 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Ticket Trend — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={6} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} name="Tickets" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* SLA compliance donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">SLA Compliance (Open Tickets)</CardTitle>
          </CardHeader>
          <CardContent>
            <SLADonut
              breakdown={analytics.slaBreakdown}
              onSliceClick={(slaStatus) => navigate(`/tickets?slaStatus=${slaStatus}`)}
            />
          </CardContent>
        </Card>

        {/* Tickets by category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tickets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    name="Tickets"
                    radius={[0, 4, 4, 0]}
                    onClick={(entry) => navigate(`/tickets?category=${entry.category}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Avg resolution time by category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Avg Resolution Time (hours)</CardTitle>
          </CardHeader>
          <CardContent>
            {resolutionData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No closed tickets yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={resolutionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: number) => [`${v}h`, 'Avg time']} />
                  <Bar dataKey="hours" name="Hours" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Tickets by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {statusData.map((s, i) => (
              <div
                key={s.name}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-white cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/tickets?status=${analytics.byStatus[i]?.status ?? ''}`)}
              >
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-sm text-slate-600">{s.name}</span>
                <span className="text-sm font-bold">{s.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technician performance */}
      {analytics.technicianPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Technician Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-fixflow-muted uppercase tracking-wide">
                    <th className="text-left py-2 pr-4 font-medium">Name</th>
                    <th className="text-right py-2 px-4 font-medium">Resolved</th>
                    <th className="text-right py-2 px-4 font-medium">Avg Time</th>
                    <th className="text-right py-2 pl-4 font-medium">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.technicianPerformance.map((t) => (
                    <tr key={t._id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-2.5 pr-4 font-medium">{t.name}</td>
                      <td className="py-2.5 px-4 text-right">{t.resolved}</td>
                      <td className="py-2.5 px-4 text-right text-slate-500">
                        {t.avgResolutionHours != null ? `${t.avgResolutionHours}h` : '—'}
                      </td>
                      <td className="py-2.5 pl-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <StarDisplay rating={t.avgRating} />
                          {t.ratingCount > 0 && (
                            <span className="text-xs text-slate-400">({t.ratingCount})</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
