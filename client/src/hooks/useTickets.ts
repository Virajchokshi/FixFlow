import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ticketsApi, TicketFilters, CreateTicketPayload } from '@/api/tickets.api';
import { TicketStatus } from '@/types';
import { toast } from 'sonner';

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => ticketsApi.list(filters),
    refetchInterval: 30_000,
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: () => ticketsApi.getById(id),
    enabled: !!id,
    refetchInterval: 30_000,
  });
}

export function useDeleteTicket(ticketId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => ticketsApi.delete(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket withdrawn');
      navigate('/tickets');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? 'Failed to withdraw ticket'),
  });
}

export function useSetPriority(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (priority: string) => ticketsApi.setPriority(ticketId, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] });
      toast.success('Priority updated');
    },
    onError: () => toast.error('Failed to update priority'),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketPayload) => ticketsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created successfully');
    },
    onError: () => toast.error('Failed to create ticket'),
  });
}

export function useUpdateTicketStatus(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status, reason }: { status: TicketStatus; reason?: string }) =>
      ticketsApi.updateStatus(ticketId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] });
      toast.success('Status updated');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? 'Failed to update status'),
  });
}

export function useAssignTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (technicianId: string) => ticketsApi.assign(ticketId, technicianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] });
      toast.success('Technician assigned');
    },
    onError: () => toast.error('Failed to assign technician'),
  });
}

export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: ['tickets', ticketId, 'comments'],
    queryFn: () => ticketsApi.listComments(ticketId),
    enabled: !!ticketId,
  });
}

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => ticketsApi.addComment(ticketId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId, 'comments'] });
    },
    onError: () => toast.error('Failed to add comment'),
  });
}

export function useDeleteComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => ticketsApi.deleteComment(ticketId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId, 'comments'] });
      toast.success('Comment deleted');
    },
    onError: () => toast.error('Failed to delete comment'),
  });
}

export function useTicketAttachments(ticketId: string) {
  return useQuery({
    queryKey: ['tickets', ticketId, 'attachments'],
    queryFn: () => ticketsApi.listAttachments(ticketId),
    enabled: !!ticketId,
  });
}

export function useUploadAttachment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => ticketsApi.uploadAttachment(ticketId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId, 'attachments'] });
      toast.success('File uploaded');
    },
    onError: () => toast.error('Failed to upload file'),
  });
}

export function useDeleteAttachment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => ticketsApi.deleteAttachment(ticketId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId, 'attachments'] });
      toast.success('Attachment deleted');
    },
    onError: () => toast.error('Failed to delete attachment'),
  });
}

export function useTicketAudit(ticketId: string, enabled = true) {
  return useQuery({
    queryKey: ['tickets', ticketId, 'audit'],
    queryFn: () => ticketsApi.getAuditLog(ticketId),
    enabled: !!ticketId && enabled,
  });
}
