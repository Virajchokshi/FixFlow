import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics.api';

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsApi.get(),
    staleTime: 5 * 60_000,
  });
}
