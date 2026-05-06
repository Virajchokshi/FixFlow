import { api } from './axios';
import { Feedback, ApiResponse } from '@/types';

export const feedbackApi = {
  get: async (ticketId: string) => {
    const res = await api.get<ApiResponse<Feedback | null>>(`/tickets/${ticketId}/feedback`);
    return res.data;
  },
  submit: async (ticketId: string, payload: { rating: number; comment?: string }) => {
    const res = await api.post<ApiResponse<Feedback>>(`/tickets/${ticketId}/feedback`, payload);
    return res.data;
  },
};
