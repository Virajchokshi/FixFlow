import { api } from './axios';
import { SLAPolicy, ApiResponse } from '@/types';
import { CreateSLAPolicyFormData } from '@/lib/validations';

export const slaApi = {
  list: async () => {
    const res = await api.get<ApiResponse<SLAPolicy[]>>('/sla-policies');
    return res.data;
  },

  create: async (data: CreateSLAPolicyFormData) => {
    const res = await api.post<ApiResponse<SLAPolicy>>('/sla-policies', data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateSLAPolicyFormData>) => {
    const res = await api.patch<ApiResponse<SLAPolicy>>(`/sla-policies/${id}`, data);
    return res.data;
  },

  triggerSweep: async () => {
    const res = await api.post<ApiResponse<{ processed: number; breached: number }>>(
      '/sla-policies/trigger-sweep'
    );
    return res.data;
  },
};
