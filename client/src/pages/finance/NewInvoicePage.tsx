import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { createInvoiceSchema, CreateInvoiceFormData } from '@/lib/validations';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useTickets } from '@/hooks/useTickets';
import { useEstimates } from '@/hooks/useEstimates';
import { TAX_RATE } from '@/lib/constants';
import { Ticket, Estimate } from '@/types';

export function NewInvoicePage() {
  const navigate = useNavigate();
  const createInvoice = useCreateInvoice();
  const { data: ticketsData } = useTickets({ limit: 100 });
  const { data: estimatesData } = useEstimates();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: { taxRate: TAX_RATE },
  });

  const onSubmit = async (data: CreateInvoiceFormData) => {
    const result = await createInvoice.mutateAsync(data);
    navigate(`/finance/invoices/${result.data._id}`);
  };

  const approvedEstimates = (estimatesData?.data ?? []).filter(
    (e: Estimate) => e.status === 'approved'
  );

  return (
    <div className="max-w-xl mx-auto w-full space-y-6">
      <PageHeader
        title="New Invoice"
        subtitle="Generate an invoice for a maintenance ticket"
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Ticket *</Label>
              <Select onValueChange={(v) => setValue('ticketId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket..." />
                </SelectTrigger>
                <SelectContent>
                  {(ticketsData?.data ?? []).map((ticket: Ticket) => (
                    <SelectItem key={ticket._id} value={ticket._id}>
                      {ticket.ticketNumber} — {ticket.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ticketId && (
                <p className="text-xs text-destructive">{errors.ticketId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Link to Approved Estimate (optional)</Label>
              <Select onValueChange={(v) => setValue('estimateId', v === '__none__' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="None — enter amounts manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {approvedEstimates.map((est: Estimate) => (
                    <SelectItem key={est._id} value={est._id}>
                      {est.estimateNumber} — ${est.total.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (optional)</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>

            <div className="flex items-center justify-between text-sm py-1">
              <span className="text-fixflow-muted">Tax Rate</span>
              <span className="font-medium">{TAX_RATE}%</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={createInvoice.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createInvoice.isPending}>
                {createInvoice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
