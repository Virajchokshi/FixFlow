import { api } from './axios';
import { ApiResponse, DashboardSummary } from '@/types';

export const dashboardApi = {
  getSummary: async () => {
    const res = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data;
  },

  getTechnicianDashboard: async () => {
    const res = await api.get<ApiResponse<unknown>>('/dashboard/technician');
    return res.data;
  },
};
