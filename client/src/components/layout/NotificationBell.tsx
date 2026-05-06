import { useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, useMarkAllRead } from '@/hooks/useNotifications';
import { useSocketContext } from '@/context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import { AppNotification } from '@/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';

const TYPE_LABELS: Record<AppNotification['type'], string> = {
  ticket_status: 'Status Update',
  ticket_assigned: 'Assignment',
  ticket_comment: 'New Comment',
};

export function NotificationBell() {
  const { data } = useNotifications();
  const markAll = useMarkAllRead();
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!socket) return;
    const handler = (notification: AppNotification) => {
      queryClient.setQueryData<typeof data>(['notifications'], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: [notification, ...old.data].slice(0, 50),
          unreadCount: old.unreadCount + 1,
        };
      });
    };
    socket.on('notification', handler);
    return () => { socket.off('notification', handler); };
  }, [socket, queryClient]);

  return (
    <DropdownMenu onOpenChange={(open) => {
      if (!open && unreadCount > 0) markAll.mutate();
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs text-fixflow-muted font-normal">{unreadCount} unread</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No notifications yet</p>
        ) : (
          <ScrollArea className="max-h-80">
            {notifications.map((n) => (
              <button
                key={n._id}
                className={cn(
                  'w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0',
                  !n.read && 'bg-blue-50/60'
                )}
                onClick={() => {
                  if (n.ticketId) navigate(`/tickets/${n.ticketId}`);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn('text-xs font-semibold', !n.read ? 'text-fixflow-primary' : 'text-slate-500')}>
                      {TYPE_LABELS[n.type]}
                    </p>
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-slate-500 truncate">{n.body}</p>
                  </div>
                  {!n.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-fixflow-primary" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{formatDate(n.createdAt)}</p>
              </button>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
