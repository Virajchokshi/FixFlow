import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEstimates } from '@/hooks/useEstimates';
import { Estimate, Ticket } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ESTIMATE_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function EstimatesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useEstimates();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Estimates"
        subtitle={`${data?.total ?? 0} total estimates`}
        action={
          <Button onClick={() => navigate('/finance/estimates/new')} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Estimate
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center justify-center py-16 border rounded-lg bg-white">
          <p className="text-sm text-fixflow-muted">No estimates yet.</p>
          <Button className="mt-4 gap-2" onClick={() => navigate('/finance/estimates/new')}>
            <PlusCircle className="h-4 w-4" />
            Create Estimate
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {data.data.map((estimate: Estimate) => {
              const ticket = typeof estimate.ticketId === 'object' ? estimate.ticketId as Ticket : null;
              return (
                <div
                  key={estimate._id}
                  className="rounded-lg border bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => navigate(`/finance/estimates/${estimate._id}`)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-fixflow-muted">{estimate.estimateNumber}</p>
                      <p className="text-sm font-medium truncate mt-0.5">{ticket?.title ?? '—'}</p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                        ESTIMATE_STATUS_COLORS[estimate.status]
                      )}
                    >
                      {estimate.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-fixflow-muted">
                    <span>{formatDate(estimate.createdAt)}</span>
                    <span className="font-semibold text-sm text-foreground">{formatCurrency(estimate.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimate #</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((estimate: Estimate) => {
                  const ticket = typeof estimate.ticketId === 'object' ? estimate.ticketId as Ticket : null;
                  return (
                    <TableRow
                      key={estimate._id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => navigate(`/finance/estimates/${estimate._id}`)}
                    >
                      <TableCell className="font-mono text-xs">{estimate.estimateNumber}</TableCell>
                      <TableCell className="text-sm">{ticket?.title ?? '—'}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                            ESTIMATE_STATUS_COLORS[estimate.status]
                          )}
                        >
                          {estimate.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(estimate.total)}
                      </TableCell>
                      <TableCell className="text-xs text-fixflow-muted">
                        {formatDate(estimate.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
