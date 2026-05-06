import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from '@/api/feedback.api';
import { toast } from 'sonner';

export function useFeedback(ticketId: string) {
  return useQuery({
    queryKey: ['tickets', ticketId, 'feedback'],
    queryFn: () => feedbackApi.get(ticketId),
    enabled: !!ticketId,
  });
}

export function useSubmitFeedback(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; comment?: string }) =>
      feedbackApi.submit(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId, 'feedback'] });
      toast.success('Thank you for your feedback!');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? 'Failed to submit feedback'),
  });
}
