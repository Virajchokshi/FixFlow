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
import { usePayments } from '@/hooks/usePayments';
import { Payment, Invoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

export function PaymentsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = usePayments();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Payments"
        subtitle={`${data?.total ?? 0} payment records`}
        action={
          <Button onClick={() => navigate('/finance/payments/new')} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Record Payment
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center justify-center py-16 border rounded-lg bg-white">
          <p className="text-sm text-fixflow-muted">No payments recorded yet.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {data.data.map((payment: Payment) => {
              const invoice = typeof payment.invoiceId === 'object' ? payment.invoiceId as Invoice : null;
              return (
                <div key={payment._id} className="rounded-lg border bg-white p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-fixflow-muted">{invoice?.invoiceNumber ?? '—'}</p>
                      <p className="text-sm font-medium capitalize mt-0.5">
                        {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                      </p>
                    </div>
                    <span className="font-semibold text-base text-green-600">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-fixflow-muted">
                    <span className="font-mono">{payment.referenceNumber}</span>
                    <span>{formatDate(payment.paymentDate)}</span>
                  </div>
                  {payment.outstandingBalance > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Outstanding: {formatCurrency(payment.outstandingBalance)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((payment: Payment) => {
                  const invoice = typeof payment.invoiceId === 'object' ? payment.invoiceId as Invoice : null;
                  return (
                    <TableRow key={payment._id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-xs">
                        {invoice?.invoiceNumber ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-fixflow-muted">
                        {payment.referenceNumber}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-right text-fixflow-muted">
                        {formatCurrency(payment.outstandingBalance)}
                      </TableCell>
                      <TableCell className="text-xs text-fixflow-muted">
                        {formatDate(payment.paymentDate)}
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
