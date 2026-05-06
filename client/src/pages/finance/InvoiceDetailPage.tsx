import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/PageHeader';
import { useInvoice, useIssueInvoice } from '@/hooks/useInvoices';
import { useEstimate } from '@/hooks/useEstimates';
import { useAuthContext } from '@/context/AuthContext';
import { Invoice, Ticket, Estimate, EstimateItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { INVOICE_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data, isLoading } = useInvoice(id!);
  const issue = useIssueInvoice(id!);

  const invoice = data?.data as Invoice | undefined;
  const linkedEstimateId =
    invoice?.estimateId
      ? typeof invoice.estimateId === 'string'
        ? invoice.estimateId
        : (invoice.estimateId as Estimate)._id
      : undefined;

  const { data: estimateData } = useEstimate(linkedEstimateId ?? '');

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!invoice) return <p className="text-sm text-fixflow-muted">Invoice not found.</p>;

  const ticket = typeof invoice.ticketId === 'object' ? invoice.ticketId as Ticket : null;
  const linkedEstimate = estimateData?.data as Estimate | undefined;
  const canIssue = user?.role === 'admin' && invoice.status === 'draft';

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={`For: ${ticket?.title ?? 'Unknown Ticket'}`}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize',
            INVOICE_STATUS_COLORS[invoice.status]
          )}
        >
          {invoice.status}
        </span>
        {canIssue && (
          <Button
            size="sm"
            className="gap-2"
            onClick={() => issue.mutateAsync()}
            disabled={issue.isPending}
          >
            <Send className="h-4 w-4" />
            Issue Invoice
          </Button>
        )}
      </div>

      {/* Invoice meta */}
      <Card>
        <CardContent className="pt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-fixflow-muted">Invoice Number</span>
            <span className="font-mono">{invoice.invoiceNumber}</span>
          </div>
          {ticket && (
            <div className="flex justify-between">
              <span className="text-fixflow-muted">Ticket</span>
              <button
                onClick={() =>
                  navigate(
                    `/tickets/${typeof invoice.ticketId === 'string' ? invoice.ticketId : (invoice.ticketId as Ticket)._id}`
                  )
                }
                className="text-fixflow-primary hover:underline"
              >
                {ticket.ticketNumber}
              </button>
            </div>
          )}
          {linkedEstimate && (
            <div className="flex justify-between">
              <span className="text-fixflow-muted">From Estimate</span>
              <button
                onClick={() => navigate(`/finance/estimates/${linkedEstimate._id}`)}
                className="text-fixflow-primary hover:underline font-mono"
              >
                {linkedEstimate.estimateNumber}
              </button>
            </div>
          )}
          {invoice.issuedAt && (
            <div className="flex justify-between">
              <span className="text-fixflow-muted">Issued Date</span>
              <span>{formatDate(invoice.issuedAt)}</span>
            </div>
          )}
          {invoice.dueDate && (
            <div className="flex justify-between">
              <span className="text-fixflow-muted">Due Date</span>
              <span>{formatDate(invoice.dueDate)}</span>
            </div>
          )}
          {invoice.paidAt && (
            <div className="flex justify-between">
              <span className="text-fixflow-muted">Paid Date</span>
              <span>{formatDate(invoice.paidAt)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line items from linked estimate */}
      {linkedEstimate && (linkedEstimate.items ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b text-left text-fixflow-muted">
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 text-right font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Unit Price</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(linkedEstimate.items ?? []).map((item: EstimateItem) => (
                    <tr key={item._id}>
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 capitalize text-fixflow-muted">{item.type}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Separator className="my-4" />
          </CardContent>
        </Card>
      )}

      {/* Totals */}
      <Card>
        <CardContent className="pt-6 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-fixflow-muted">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fixflow-muted">Tax</span>
            <span>{formatCurrency(invoice.tax)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold text-base">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
