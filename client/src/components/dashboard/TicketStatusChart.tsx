import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STATUS_LABELS } from '@/lib/constants';

interface TicketStatusChartProps {
  distribution: Record<string, number>;
}

const STATUS_CHART_COLORS: Record<string, string> = {
  SUBMITTED: '#94A3B8',
  UNDER_REVIEW: '#3B82F6',
  APPROVED: '#10B981',
  REJECTED: '#EF4444',
  ASSIGNED: '#8B5CF6',
  IN_PROGRESS: '#F59E0B',
  ON_HOLD: '#F97316',
  PENDING_INSPECTION: '#06B6D4',
  INSPECTION_FAILED: '#F43F5E',
  PENDING_ESTIMATE: '#EAB308',
  ESTIMATE_APPROVED: '#14B8A6',
  PENDING_INVOICE: '#6366F1',
  PAYMENT_PENDING: '#A855F7',
  CLOSED: '#22C55E',
};

export function TicketStatusChart({ distribution }: TicketStatusChartProps) {
  const data = Object.entries(distribution)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status,
      value: count,
      color: STATUS_CHART_COLORS[status] ?? '#94A3B8',
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tickets by Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-sm text-fixflow-muted">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tickets by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [value, name]}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
