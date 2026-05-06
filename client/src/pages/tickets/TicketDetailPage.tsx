import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Check, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/tickets/TicketPriorityBadge';
import { TicketTimeline } from '@/components/tickets/TicketTimeline';
import { AssignTechnicianModal } from '@/components/tickets/AssignTechnicianModal';
import { CommentThread } from '@/components/tickets/CommentThread';
import { AttachmentUpload } from '@/components/tickets/AttachmentUpload';
import { SLABadge } from '@/components/sla/SLABadge';
import { SLACountdown } from '@/components/sla/SLACountdown';
import {
  useTicket,
  useUpdateTicketStatus,
  useAssignTicket,
  useDeleteTicket,
  useSetPriority,
  useTicketComments,
  useAddComment,
  useDeleteComment,
  useTicketAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  useTicketAudit,
} from '@/hooks/useTickets';
import { AIAnalysisSuggestion } from '@/components/tickets/AIAnalysisSuggestion';
import { FeedbackCard } from '@/components/tickets/FeedbackCard';
import { useAuthContext } from '@/context/AuthContext';
import { usersApi } from '@/api/users.api';
import { useQuery } from '@tanstack/react-query';
import { Ticket, TicketStatus, TicketPriority, NextAction, User } from '@/types';
import { formatDate } from '@/lib/utils';
import { STATUS_LABELS, STATUS_COLORS, CATEGORY_LABELS as CAT_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

/* ─── Step Tracker ─────────────────────────────────────────────────────────── */

function StepTracker({
  stages,
  currentStatus,
}: {
  stages: TicketStatus[];
  currentStatus: TicketStatus;
}) {
  const isRejected = currentStatus === 'REJECTED';
  const isOnHold = currentStatus === 'ON_HOLD';

  // For ON_HOLD, highlight up to IN_PROGRESS
  const effectiveStatus = isOnHold ? 'IN_PROGRESS' : currentStatus;
  const currentIdx = stages.indexOf(effectiveStatus);

  return (
    <div className="w-full">
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-center">
        {stages.map((stage, idx) => {
          const isDone = currentIdx > idx;
          const isCurrent = currentIdx === idx && !isRejected;
          const isFuture = currentIdx < idx || isRejected;

          return (
            <div key={stage} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold border-2 transition-colors',
                    isDone && 'bg-green-500 border-green-500 text-white',
                    isCurrent && 'bg-fixflow-primary border-fixflow-primary text-white',
                    isFuture && 'bg-white border-slate-200 text-slate-400'
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    'text-[10px] mt-1 font-medium text-center leading-tight whitespace-nowrap',
                    isDone && 'text-green-600',
                    isCurrent && 'text-fixflow-primary',
                    isFuture && 'text-slate-400'
                  )}
                >
                  {STATUS_LABELS[stage]}
                </span>
              </div>
              {idx < stages.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-1.5 mt-[-16px]',
                    currentIdx > idx ? 'bg-green-400' : 'bg-slate-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact */}
      <div className="sm:hidden flex items-center gap-1.5 flex-wrap">
        {stages.map((stage, idx) => {
          const isDone = currentIdx > idx;
          const isCurrent = currentIdx === idx && !isRejected;
          return (
            <div
              key={stage}
              className={cn(
                'h-1.5 flex-1 min-w-[20px] rounded-full',
                isDone && 'bg-green-400',
                isCurrent && 'bg-fixflow-primary',
                !isDone && !isCurrent && 'bg-slate-200'
              )}
              title={STATUS_LABELS[stage]}
            />
          );
        })}
      </div>

      {/* Rejected / On Hold indicator */}
      {isRejected && (
        <div className="mt-2 text-center">
          <TicketStatusBadge status="REJECTED" />
        </div>
      )}
      {isOnHold && (
        <div className="mt-2 text-center">
          <TicketStatusBadge status="ON_HOLD" />
          <p className="text-xs text-fixflow-muted mt-1">Work paused — was In Progress</p>
        </div>
      )}
    </div>
  );
}

/* ─── Action Buttons ───────────────────────────────────────────────────────── */

function NextActionButtons({
  actions,
  onAction,
  isPending,
}: {
  actions: NextAction[];
  onAction: (status: TicketStatus, reason?: string) => void;
  isPending: boolean;
}) {
  const [reasonFor, setReasonFor] = useState<TicketStatus | null>(null);
  const [reasonText, setReasonText] = useState('');

  const needsReason = (status: TicketStatus) =>
    status === 'REJECTED' || status === 'ON_HOLD' || status === 'IN_PROGRESS';

  const handleClick = (action: NextAction) => {
    if (needsReason(action.to) && action.variant !== 'default') {
      setReasonFor(action.to);
      return;
    }
    onAction(action.to);
  };

  const submitWithReason = () => {
    if (!reasonFor) return;
    onAction(reasonFor, reasonText || undefined);
    setReasonFor(null);
    setReasonText('');
  };

  if (actions.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-fixflow-muted uppercase tracking-wide">
        Next Step
      </p>

      {/* Reason form if expanded */}
      {reasonFor && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium">
            Reason for {STATUS_LABELS[reasonFor]} <span className="text-fixflow-muted">(optional)</span>
          </p>
          <Textarea
            rows={2}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Add context..."
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setReasonFor(null); setReasonText(''); }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submitWithReason} disabled={isPending}>
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Confirm
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!reasonFor && (
        <div className="flex flex-col gap-2">
          {actions.map((action) => (
            <Button
              key={action.to}
              variant={action.variant === 'default' ? 'default' : action.variant}
              className="w-full justify-center"
              disabled={isPending}
              onClick={() => handleClick(action)}
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const { data: ticketData, isLoading } = useTicket(id!);
  const { data: commentsData } = useTicketComments(id!);
  const { data: attachmentsData } = useTicketAttachments(id!);
  const { data: auditData } = useTicketAudit(id!, user?.role === 'admin');
  const ticketCategory = (ticketData?.data as any)?.category as string | undefined;
  const { data: techniciansData, isLoading: techLoading } = useQuery({
    queryKey: ['technicians', ticketCategory],
    queryFn: () => usersApi.listTechnicians(ticketCategory),
    enabled: assignModalOpen && !!ticketCategory,
  });

  const updateStatus = useUpdateTicketStatus(id!);
  const assignTicket = useAssignTicket(id!);
  const deleteTicket = useDeleteTicket(id!);
  const setPriority = useSetPriority(id!);
  const addComment = useAddComment(id!);
  const deleteComment = useDeleteComment(id!);
  const uploadAttachment = useUploadAttachment(id!);
  const deleteAttachment = useDeleteAttachment(id!);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-60" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const ticket = ticketData?.data as Ticket;
  if (!ticket) return <div className="text-sm text-fixflow-muted">Ticket not found.</div>;

  const submittedBy = typeof ticket.submittedBy === 'object' ? ticket.submittedBy as User : null;
  const assignedTo = typeof ticket.assignedTo === 'object' ? ticket.assignedTo as User : null;

  const nextActions: NextAction[] = ticket.nextActions ?? [];
  const pipelineStages: TicketStatus[] = ticket.pipelineStages ?? [
    'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED',
  ];
  const canAssign = user?.role === 'admin' && ticket.status === 'APPROVED';

  // Delete: user can withdraw own SUBMITTED ticket; admin can delete any
  const isOwner = submittedBy?._id === user?._id;
  const canDelete =
    user?.role === 'admin' ||
    (isOwner && ticket.status === 'SUBMITTED');

  const handleAction = async (status: TicketStatus, reason?: string) => {
    await updateStatus.mutateAsync({ status, reason });
  };

  const handleDelete = async () => {
    const label = user?.role === 'admin' ? 'delete' : 'withdraw';
    if (!window.confirm(`Are you sure you want to ${label} this ticket? This cannot be undone.`)) return;
    await deleteTicket.mutateAsync();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.title}
        subtitle={ticket.ticketNumber}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      {/* Pipeline step tracker */}
      <Card>
        <CardContent className="py-4 px-4 sm:px-6">
          <StepTracker stages={pipelineStages} currentStatus={ticket.status} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-fixflow-muted uppercase tracking-wide">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              {ticket.category === 'other' && ticket.customCategory && (
                <div className="rounded-md bg-slate-50 border px-3 py-2 text-sm">
                  <span className="text-fixflow-muted text-xs font-medium uppercase tracking-wide">Issue type: </span>
                  <span>{ticket.customCategory}</span>
                </div>
              )}
              {ticket.imageBase64 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-fixflow-muted uppercase tracking-wide">
                    Attached Image
                  </p>
                  <img
                    src={ticket.imageBase64}
                    alt="Ticket attachment"
                    className="rounded-lg border border-slate-200 max-h-96 w-auto object-contain bg-slate-50"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis — shown if image was analysed at submission time */}
          {ticket.aiAnalysis && (
            <AIAnalysisSuggestion analysis={ticket.aiAnalysis} />
          )}

          {/* Feedback — only shown on CLOSED tickets with an assigned technician */}
          {ticket.status === 'CLOSED' && ticket.assignedTo && (
            <FeedbackCard
              ticketId={ticket._id}
              submittedBy={ticket.submittedBy}
              assignedTo={ticket.assignedTo}
              currentUserId={user?._id ?? ''}
            />
          )}

          {/* Tabs: Comments, Attachments, Timeline */}
          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
              {user?.role === 'admin' && (
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="comments" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <CommentThread
                    comments={commentsData?.data ?? []}
                    currentUser={user!}
                    onAdd={(body) => addComment.mutateAsync(body).then(() => {})}
                    onDelete={(commentId) => deleteComment.mutateAsync(commentId).then(() => {})}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <AttachmentUpload
                    attachments={attachmentsData?.data ?? []}
                    currentUser={user!}
                    onUpload={(file) => uploadAttachment.mutateAsync(file).then(() => {})}
                    onDelete={(attId) => deleteAttachment.mutateAsync(attId).then(() => {})}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {user?.role === 'admin' && (
              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <TicketTimeline logs={auditData?.data ?? []} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-fixflow-muted uppercase tracking-wide">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TicketStatusBadge status={ticket.status} />

              <div className="space-y-2">
                <SLABadge status={ticket.slaStatus} />
                <SLACountdown deadline={ticket.slaDeadline} slaStatus={ticket.slaStatus} />
              </div>

              <Separator />

              {/* Direct action buttons — show exactly what comes next */}
              <NextActionButtons
                actions={nextActions}
                onAction={handleAction}
                isPending={updateStatus.isPending}
              />

              {canAssign && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setAssignModalOpen(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Assign Technician
                </Button>
              )}

              {nextActions.length === 0 && !canAssign && (
                <p className="text-xs text-fixflow-muted text-center py-1">
                  {ticket.status === 'CLOSED' || ticket.status === 'REJECTED'
                    ? 'This ticket is finalized.'
                    : 'No actions available for your role.'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-fixflow-muted uppercase tracking-wide">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Priority — editable by admin, read-only otherwise */}
              <div className="space-y-1">
                <span className="text-fixflow-muted text-xs">Priority</span>
                {user?.role === 'admin' ? (
                  <Select
                    value={ticket.priority}
                    onValueChange={(v) => setPriority.mutate(v)}
                    disabled={setPriority.isPending}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div><TicketPriorityBadge priority={ticket.priority} /></div>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-fixflow-muted">Category</span>
                <span className="capitalize">
                  {ticket.category === 'other' && ticket.customCategory
                    ? ticket.customCategory
                    : CAT_LABELS[ticket.category]}
                </span>
              </div>

              {/* Location — full text, no truncation */}
              <div className="space-y-0.5">
                <span className="text-fixflow-muted">Location</span>
                <p className="text-sm break-words">{ticket.location}</p>
              </div>

              <Separator />
              <div className="flex justify-between">
                <span className="text-fixflow-muted">Submitted by</span>
                <span>{submittedBy?.name ?? '—'}</span>
              </div>
              {assignedTo && (
                <div className="flex justify-between">
                  <span className="text-fixflow-muted">Assigned to</span>
                  <span>{assignedTo.name}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-fixflow-muted">Created</span>
                <span>{formatDate(ticket.createdAt)}</span>
              </div>
              {ticket.closedAt && (
                <div className="flex justify-between">
                  <span className="text-fixflow-muted">Closed</span>
                  <span>{formatDate(ticket.closedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdraw / Delete */}
          {canDelete && (
            <Button
              variant="outline"
              className="w-full gap-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
              onClick={handleDelete}
              disabled={deleteTicket.isPending}
            >
              {deleteTicket.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Trash2 className="h-4 w-4" />}
              {user?.role === 'admin' ? 'Delete Ticket' : 'Withdraw Ticket'}
            </Button>
          )}
        </div>
      </div>

      {/* Assign modal */}
      <AssignTechnicianModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={(techId) => assignTicket.mutateAsync(techId).then(() => {})}
        technicians={techniciansData?.data ?? []}
        isLoading={techLoading}
      />
    </div>
  );
}
