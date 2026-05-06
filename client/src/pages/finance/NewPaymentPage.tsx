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
import { createPaymentSchema, CreatePaymentFormData } from '@/lib/validations';
import { useCreatePayment } from '@/hooks/usePayments';
import { useInvoices } from '@/hooks/useInvoices';
import { Invoice } from '@/types';
import { formatCurrency } from '@/lib/utils';

export function NewPaymentPage() {
  const navigate = useNavigate();
  const createPayment = useCreatePayment();
  const { data: invoicesData } = useInvoices();

  const outstandingInvoices = (invoicesData?.data ?? []).filter(
    (inv: Invoice) => inv.status === 'issued' || inv.status === 'partial'
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreatePaymentFormData>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: CreatePaymentFormData) => {
    await createPayment.mutateAsync(data);
    navigate('/finance/payments');
  };

  return (
    <div className="max-w-xl mx-auto w-full space-y-6">
      <PageHeader
        title="Record Payment"
        subtitle="Log a payment against an issued invoice"
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Invoice *</Label>
              <Select onValueChange={(v) => setValue('invoiceId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select invoice..." />
                </SelectTrigger>
                <SelectContent>
                  {outstandingInvoices.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No outstanding invoices
                    </SelectItem>
                  ) : (
                    outstandingInvoices.map((inv: Invoice) => (
                      <SelectItem key={inv._id} value={inv._id}>
                        {inv.invoiceNumber} — {formatCurrency(inv.total)} ({inv.status})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.invoiceId && (
                <p className="text-xs text-destructive">{errors.invoiceId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  min={0.01}
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select
                  onValueChange={(v) =>
                    setValue('method', v as CreatePaymentFormData['method'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
                {errors.method && (
                  <p className="text-xs text-destructive">{errors.method.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number *</Label>
              <Input
                id="referenceNumber"
                placeholder="TXN-12345 / CHQ-001..."
                {...register('referenceNumber')}
              />
              {errors.referenceNumber && (
                <p className="text-xs text-destructive">{errors.referenceNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                {...register('paymentDate')}
              />
              {errors.paymentDate && (
                <p className="text-xs text-destructive">{errors.paymentDate.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={createPayment.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPayment.isPending}>
                {createPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
