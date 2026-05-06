import { api } from './axios';
import { AppNotification } from '@/types';

interface NotificationsResponse {
  success: boolean;
  data: AppNotification[];
  unreadCount: number;
}

export const notificationsApi = {
  list: async () => {
    const res = await api.get<NotificationsResponse>('/notifications');
    return res.data;
  },
  markAllRead: async () => {
    await api.patch('/notifications/read-all');
  },
};
