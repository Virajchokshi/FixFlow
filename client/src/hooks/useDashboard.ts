import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard.api';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getSummary(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useTechnicianDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'technician'],
    queryFn: () => dashboardApi.getTechnicianDashboard(),
    refetchInterval: 2 * 60 * 1000,
  });
}
