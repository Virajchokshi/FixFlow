import { api } from './axios';
import { Payment, ApiResponse, PaginatedResponse } from '@/types';
import { CreatePaymentFormData } from '@/lib/validations';

export const paymentsApi = {
  list: async (page = 1, limit = 20) => {
    const res = await api.get<PaginatedResponse<Payment>>(`/payments?page=${page}&limit=${limit}`);
    return res.data;
  },

  create: async (data: CreatePaymentFormData) => {
    const res = await api.post<ApiResponse<Payment>>('/payments', data);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
    return res.data;
  },
};
