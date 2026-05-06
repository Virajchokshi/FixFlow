import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { slaApi } from '@/api/sla.api';
import { CreateSLAPolicyFormData } from '@/lib/validations';
import { toast } from 'sonner';

export function useSLAPolicies() {
  return useQuery({
    queryKey: ['sla-policies'],
    queryFn: () => slaApi.list(),
  });
}

export function useCreateSLAPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSLAPolicyFormData) => slaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast.success('SLA policy created');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? 'Failed to create policy'),
  });
}

export function useUpdateSLAPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSLAPolicyFormData> }) =>
      slaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast.success('SLA policy updated');
    },
    onError: () => toast.error('Failed to update policy'),
  });
}

export function useTriggerSLASweep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => slaApi.triggerSweep(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success(`SLA sweep complete: ${data.data.processed} processed, ${data.data.breached} breached`);
    },
    onError: () => toast.error('Failed to trigger sweep'),
  });
}
