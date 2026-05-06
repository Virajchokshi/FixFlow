import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { estimatesApi } from '@/api/estimates.api';
import { CreateEstimateFormData } from '@/lib/validations';
import { toast } from 'sonner';

export function useEstimates(page = 1) {
  return useQuery({
    queryKey: ['estimates', page],
    queryFn: () => estimatesApi.list(page),
    refetchInterval: 30_000,
  });
}

export function useEstimate(id: string) {
  return useQuery({
    queryKey: ['estimates', id],
    queryFn: () => estimatesApi.getById(id),
    enabled: !!id,
    refetchInterval: 30_000,
  });
}

export function useCreateEstimate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEstimateFormData) => estimatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate created');
    },
    onError: () => toast.error('Failed to create estimate'),
  });
}

export function useSubmitEstimate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => estimatesApi.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimates', id] });
      toast.success('Estimate submitted for review');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? 'Failed to submit estimate'),
  });
}

export function useApproveEstimate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => estimatesApi.approve(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimates', id] });
      toast.success('Estimate approved');
    },
    onError: () => toast.error('Failed to approve estimate'),
  });
}

export function useRejectEstimate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => estimatesApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimates', id] });
      toast.success('Estimate rejected');
    },
    onError: () => toast.error('Failed to reject estimate'),
  });
}

export function useUpdateEstimateItem(estimateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: { type: string; description: string; quantity: number; unitPrice: number } }) =>
      estimatesApi.updateItem(estimateId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates', estimateId] });
    },
    onError: () => toast.error('Failed to update item'),
  });
}

export function useRequestRevision(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => estimatesApi.requestRevision(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimates', id] });
      toast.success('Revision requested');
    },
    onError: () => toast.error('Failed to request revision'),
  });
}
