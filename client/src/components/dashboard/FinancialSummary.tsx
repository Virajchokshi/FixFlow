import { DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface FinancialSummaryProps {
  totalRevenue: number;
  openTickets: number;
  closedTickets: number;
}

export function FinancialSummary({ totalRevenue, openTickets, closedTickets }: FinancialSummaryProps) {
  const completionRate = openTickets + closedTickets > 0
    ? ((closedTickets / (openTickets + closedTickets)) * 100).toFixed(1)
    : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Financial Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-2 text-sm text-fixflow-muted">
            <DollarSign className="h-4 w-4" />
            Total Revenue Collected
          </div>
          <span className="font-semibold text-green-600">{formatCurrency(totalRevenue)}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-sm text-fixflow-muted">Open Tickets</span>
          <span className="font-semibold">{openTickets}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-sm text-fixflow-muted">Closed Tickets</span>
          <span className="font-semibold text-green-600">{closedTickets}</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-sm text-fixflow-muted">
            <TrendingUp className="h-4 w-4" />
            Completion Rate
          </div>
          <span className="font-semibold">{completionRate}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
