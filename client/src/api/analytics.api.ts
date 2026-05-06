import { api } from './axios';
import { AnalyticsData, ApiResponse } from '@/types';

export const analyticsApi = {
  get: async () => {
    const res = await api.get<ApiResponse<AnalyticsData>>('/analytics');
    return res.data;
  },
};
