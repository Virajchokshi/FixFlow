import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Ticket, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/tickets/TicketPriorityBadge';
import { SLABadge } from '@/components/sla/SLABadge';
import { NewTicketModal } from '@/components/tickets/NewTicketModal';
import { useTickets } from '@/hooks/useTickets';
import { useAuthContext } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';
import { Ticket as TicketType } from '@/types';

export function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [newTicketOpen, setNewTicketOpen] = useState(false);

  const { data, isLoading } = useTickets({ limit: 50 });

  const tickets: TicketType[] = data?.data ?? [];
  const openTickets = tickets.filter(
    (t) => !['CLOSED', 'REJECTED'].includes(t.status)
  );
  const closedTickets = tickets.filter((t) => t.status === 'CLOSED');
  const breachedTickets = tickets.filter((t) => t.slaStatus === 'breached');

  return (
    <div className="space-y-6">
      <NewTicketModal open={newTicketOpen} onOpenChange={setNewTicketOpen} />

      <PageHeader
        title={`Welcome, ${user?.name ?? 'User'}`}
        subtitle="Here's an overview of your maintenance requests"
        action={
          <Button onClick={() => setNewTicketOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Ticket
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tickets')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-fixflow-muted">Total Submitted</CardTitle>
            <Ticket className="h-4 w-4 text-fixflow-muted" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{tickets.length}</p>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tickets')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-fixflow-muted">Open</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-amber-600">{openTickets.length}</p>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tickets?status=CLOSED')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-fixflow-muted">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-green-600">{closedTickets.length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">My Tickets</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
            View all
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ticket className="h-10 w-10 text-fixflow-muted mb-3" />
              <p className="text-sm font-medium">No tickets yet</p>
              <p className="text-xs text-fixflow-muted mt-1">
                Submit your first maintenance request to get started.
              </p>
              <Button className="mt-4 gap-2" onClick={() => setNewTicketOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                New Ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {tickets.slice(0, 10).map((ticket) => (
                <div
                  key={ticket._id}
                  className="flex items-center justify-between rounded-md p-3 cursor-pointer hover:bg-slate-50 transition-colors gap-3"
                  onClick={() => navigate(`/tickets/${ticket._id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{ticket.title}</p>
                    <p className="text-xs text-fixflow-muted mt-0.5">
                      #{ticket.ticketNumber} · {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <TicketPriorityBadge priority={ticket.priority} />
                    <TicketStatusBadge status={ticket.status} />
                    <span className="hidden sm:block">
                      <SLABadge status={ticket.slaStatus} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {breachedTickets.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              SLA Breached — {breachedTickets.length} ticket{breachedTickets.length > 1 ? 's' : ''} overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-red-600">
              The following tickets have exceeded their resolution deadline. Contact support for an update.
            </p>
            <ul className="mt-2 space-y-1">
              {breachedTickets.map((t) => (
                <li
                  key={t._id}
                  className="text-xs text-red-700 cursor-pointer hover:underline"
                  onClick={() => navigate(`/tickets/${t._id}`)}
                >
                  #{t.ticketNumber} — {t.title}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
