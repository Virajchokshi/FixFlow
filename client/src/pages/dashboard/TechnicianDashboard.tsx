import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle, Wrench } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/tickets/TicketPriorityBadge';
import { SLABadge } from '@/components/sla/SLABadge';
import { useTechnicianDashboard } from '@/hooks/useDashboard';
import { Ticket } from '@/types';
import { formatDate } from '@/lib/utils';

export function TechnicianDashboard() {
  const { data, isLoading } = useTechnicianDashboard();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const techData = data?.data as any;
  const assignedTickets: Ticket[] = techData?.assignedTickets ?? [];
  const metrics = techData?.metrics ?? {};

  return (
    <div className="space-y-6">
      <PageHeader title="My Dashboard" subtitle="Your assigned tickets and workload" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Assigned Tickets"
          value={metrics.totalAssigned ?? 0}
          icon={<ClipboardList className="h-5 w-5" />}
          iconColor="bg-blue-50 text-blue-600"
          onClick={() => navigate('/tickets')}
        />
        <MetricCard
          title="In Progress"
          value={metrics.inProgressTickets ?? 0}
          icon={<Clock className="h-5 w-5" />}
          iconColor="bg-amber-50 text-amber-600"
          onClick={() => navigate('/tickets?status=IN_PROGRESS')}
        />
        <MetricCard
          title="Completed This Month"
          value={metrics.completedThisMonth ?? 0}
          icon={<CheckCircle className="h-5 w-5" />}
          iconColor="bg-green-50 text-green-600"
          onClick={() => navigate('/tickets?status=COMPLETED')}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Active Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedTickets.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-8 w-8 text-fixflow-muted mx-auto mb-3" />
              <p className="text-sm text-fixflow-muted">No active tickets assigned to you.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tickets/${ticket._id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-fixflow-muted">
                        {ticket.ticketNumber}
                      </span>
                      <TicketPriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="text-sm font-medium truncate">{ticket.title}</p>
                    <p className="text-xs text-fixflow-muted">{ticket.location}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <TicketStatusBadge status={ticket.status} />
                    <SLABadge status={ticket.slaStatus} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
