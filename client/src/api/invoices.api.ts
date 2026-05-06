import { api } from './axios';
import { Invoice, ApiResponse, PaginatedResponse } from '@/types';
import { CreateInvoiceFormData } from '@/lib/validations';

export const invoicesApi = {
  list: async (page = 1, limit = 20) => {
    const res = await api.get<PaginatedResponse<Invoice>>(`/invoices?page=${page}&limit=${limit}`);
    return res.data;
  },

  create: async (data: CreateInvoiceFormData) => {
    const res = await api.post<ApiResponse<Invoice>>('/invoices', data);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return res.data;
  },

  update: async (id: string, data: { dueDate?: string }) => {
    const res = await api.patch<ApiResponse<Invoice>>(`/invoices/${id}`, data);
    return res.data;
  },

  issue: async (id: string) => {
    const res = await api.patch<ApiResponse<Invoice>>(`/invoices/${id}/issue`);
    return res.data;
  },

  convertFromEstimate: async (estimateId: string, dueDate?: string) => {
    const res = await api.post<ApiResponse<Invoice>>(`/invoices/from-estimate/${estimateId}`, {
      dueDate,
    });
    return res.data;
  },
};
