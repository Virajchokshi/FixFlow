import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/api/payments.api';
import { CreatePaymentFormData } from '@/lib/validations';
import { toast } from 'sonner';

export function usePayments(page = 1) {
  return useQuery({
    queryKey: ['payments', page],
    queryFn: () => paymentsApi.list(page),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaymentFormData) => paymentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment recorded');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? 'Failed to record payment'),
  });
}
