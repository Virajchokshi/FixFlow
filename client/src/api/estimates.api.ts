import { api } from './axios';
import { Estimate, ApiResponse, PaginatedResponse } from '@/types';
import { CreateEstimateFormData } from '@/lib/validations';

export const estimatesApi = {
  list: async (page = 1, limit = 20) => {
    const res = await api.get<PaginatedResponse<Estimate>>(`/estimates?page=${page}&limit=${limit}`);
    return res.data;
  },

  create: async (data: CreateEstimateFormData) => {
    const res = await api.post<ApiResponse<Estimate>>('/estimates', data);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Estimate>>(`/estimates/${id}`);
    return res.data;
  },

  update: async (id: string, data: { notes?: string; taxRate?: number }) => {
    const res = await api.patch<ApiResponse<Estimate>>(`/estimates/${id}`, data);
    return res.data;
  },

  addItem: async (
    id: string,
    item: { type: string; description: string; quantity: number; unitPrice: number }
  ) => {
    const res = await api.post<ApiResponse<Estimate>>(`/estimates/${id}/items`, item);
    return res.data;
  },

  updateItem: async (
    id: string,
    itemId: string,
    item: { type: string; description: string; quantity: number; unitPrice: number }
  ) => {
    const res = await api.patch<ApiResponse<Estimate>>(`/estimates/${id}/items/${itemId}`, item);
    return res.data;
  },

  deleteItem: async (id: string, itemId: string) => {
    const res = await api.delete<ApiResponse<null>>(`/estimates/${id}/items/${itemId}`);
    return res.data;
  },

  submit: async (id: string) => {
    const res = await api.patch<ApiResponse<Estimate>>(`/estimates/${id}/submit`);
    return res.data;
  },

  approve: async (id: string, reason?: string) => {
    const res = await api.patch<ApiResponse<Estimate>>(`/estimates/${id}/approve`, { reason });
    return res.data;
  },

  reject: async (id: string, reason?: string) => {
    const res = await api.patch<ApiResponse<Estimate>>(`/estimates/${id}/reject`, { reason });
    return res.data;
  },

  requestRevision: async (id: string, notes?: string) => {
    const res = await api.patch<ApiResponse<Estimate>>(`/estimates/${id}/request-revision`, { notes });
    return res.data;
  },
};
