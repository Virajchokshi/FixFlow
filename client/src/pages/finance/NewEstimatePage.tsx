import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/PageHeader';
import { createEstimateSchema, CreateEstimateFormData } from '@/lib/validations';
import { useCreateEstimate } from '@/hooks/useEstimates';
import { useTickets } from '@/hooks/useTickets';
import { formatCurrency } from '@/lib/utils';
import { TAX_RATE } from '@/lib/constants';
import { Ticket } from '@/types';

export function NewEstimatePage() {
  const navigate = useNavigate();
  const createEstimate = useCreateEstimate();
  const { data: ticketsData } = useTickets({ limit: 100 });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEstimateFormData>({
    resolver: zodResolver(createEstimateSchema),
    defaultValues: {
      items: [{ type: 'labor', description: '', quantity: 1, unitPrice: 0 }],
      taxRate: TAX_RATE,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items');

  const subtotal = watchedItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
  const tax = subtotal * (TAX_RATE / 100);
  const total = subtotal + tax;

  const onSubmit = async (data: CreateEstimateFormData) => {
    const result = await createEstimate.mutateAsync(data);
    navigate(`/finance/estimates/${result.data._id}`);
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <PageHeader
        title="New Estimate"
        subtitle="Create a cost estimate for a maintenance ticket"
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Ticket selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Ticket *</Label>
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
          </CardContent>
        </Card>

        {/* Line items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Line Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                append({ type: 'labor', description: '', quantity: 1, unitPrice: 0 })
              }
            >
              <PlusCircle className="h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-fixflow-muted pb-1 border-b">
              <div className="col-span-1">Type</div>
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1" />
            </div>

            {fields.map((field, index) => {
              const qty = Number(watchedItems[index]?.quantity) || 0;
              const price = Number(watchedItems[index]?.unitPrice) || 0;
              const lineTotal = qty * price;

              return (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-1">
                    <Select
                      defaultValue="labor"
                      onValueChange={(v) =>
                        setValue(
                          `items.${index}.type`,
                          v as CreateEstimateFormData['items'][0]['type']
                        )
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="parts">Parts</SelectItem>
                        <SelectItem value="overhead">Overhead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-5">
                    <Input
                      className="h-9 text-sm"
                      placeholder="Description..."
                      {...register(`items.${index}.description`)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      className="h-9 text-sm text-right"
                      type="number"
                      min={0}
                      step="0.01"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      className="h-9 text-sm text-right"
                      type="number"
                      min={0}
                      step="0.01"
                      {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-end h-9 text-sm font-medium">
                    {formatCurrency(lineTotal)}
                  </div>
                  <div className="col-span-1 flex items-center justify-center h-9">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-fixflow-muted hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            <Separator className="mt-4" />

            {/* Totals */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-fixflow-muted">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-fixflow-muted">Tax ({TAX_RATE}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Additional notes or terms..."
              rows={3}
              {...register('notes')}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={createEstimate.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createEstimate.isPending}>
            {createEstimate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Estimate
          </Button>
        </div>
      </form>
    </div>
  );
}
