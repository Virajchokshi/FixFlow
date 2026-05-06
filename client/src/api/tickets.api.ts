import { api } from './axios';
import {
  Ticket,
  TicketComment,
  TicketAttachment,
  AuditLog,
  AIAnalysis,
  ApiResponse,
  PaginatedResponse,
  TicketStatus,
} from '@/types';
import { CreateTicketFormData } from '@/lib/validations';

export type CreateTicketPayload = CreateTicketFormData & { aiAnalysis?: AIAnalysis };

export interface TicketFilters {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: string;
  category?: string;
  slaStatus?: string;
}

export const ticketsApi = {
  list: async (filters: TicketFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.append(k, String(v));
    });
    const res = await api.get<PaginatedResponse<Ticket>>(`/tickets?${params}`);
    return res.data;
  },

  create: async (data: CreateTicketPayload) => {
    const res = await api.post<ApiResponse<Ticket>>('/tickets', data);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateTicketFormData>) => {
    const res = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/tickets/${id}`);
    return res.data;
  },

  setPriority: async (id: string, priority: string) => {
    const res = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/priority`, { priority });
    return res.data;
  },

  updateStatus: async (id: string, status: TicketStatus, reason?: string) => {
    const res = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/status`, { status, reason });
    return res.data;
  },

  assign: async (id: string, technicianId: string) => {
    const res = await api.post<ApiResponse<Ticket>>(`/tickets/${id}/assign`, { technicianId });
    return res.data;
  },

  // Comments
  listComments: async (ticketId: string) => {
    const res = await api.get<ApiResponse<TicketComment[]>>(`/tickets/${ticketId}/comments`);
    return res.data;
  },

  addComment: async (ticketId: string, body: string) => {
    const res = await api.post<ApiResponse<TicketComment>>(`/tickets/${ticketId}/comments`, { body });
    return res.data;
  },

  deleteComment: async (ticketId: string, commentId: string) => {
    const res = await api.delete<ApiResponse<null>>(`/tickets/${ticketId}/comments/${commentId}`);
    return res.data;
  },

  // Attachments
  listAttachments: async (ticketId: string) => {
    const res = await api.get<ApiResponse<TicketAttachment[]>>(`/tickets/${ticketId}/attachments`);
    return res.data;
  },

  uploadAttachment: async (ticketId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<TicketAttachment>>(
      `/tickets/${ticketId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  deleteAttachment: async (ticketId: string, attachmentId: string) => {
    const res = await api.delete<ApiResponse<null>>(
      `/tickets/${ticketId}/attachments/${attachmentId}`
    );
    return res.data;
  },

  // Audit
  getAuditLog: async (ticketId: string) => {
    const res = await api.get<ApiResponse<AuditLog[]>>(`/tickets/${ticketId}/audit`);
    return res.data;
  },
};
