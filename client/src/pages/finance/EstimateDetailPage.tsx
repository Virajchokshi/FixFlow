import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Send, FileText, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  useEstimate,
  useApproveEstimate,
  useRejectEstimate,
  useSubmitEstimate,
  useRequestRevision,
  useUpdateEstimateItem,
} from '@/hooks/useEstimates';
import { useConvertFromEstimate } from '@/hooks/useInvoices';
import { useAuthContext } from '@/context/AuthContext';
import { Estimate, Ticket, User, EstimateItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ESTIMATE_STATUS_COLORS, ESTIMATE_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ItemEditState {
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data, isLoading } = useEstimate(id!);

  const approve = useApproveEstimate(id!);
  const reject = useRejectEstimate(id!);
  const submit = useSubmitEstimate(id!);
  const requestRevision = useRequestRevision(id!);
  const convertToInvoice = useConvertFromEstimate();

  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ItemEditState>({ type: 'labor', description: '', quantity: 1, unitPrice: 0 });
  const updateItem = useUpdateEstimateItem(id!);

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const estimate = data?.data as Estimate;
  if (!estimate) return <p className="text-sm text-fixflow-muted">Estimate not found.</p>;

  const ticket = typeof estimate.ticketId === 'object' ? estimate.ticketId as Ticket : null;
  const createdBy = typeof estimate.createdBy === 'object' ? estimate.createdBy as User : null;

  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';
  const canEditItems = isTechnician && (estimate.status === 'draft' || estimate.status === 'revision_requested');

  const startEditItem = (item: EstimateItem) => {
    setEditingItemId(item._id);
    setEditForm({ type: item.type, description: item.description, quantity: item.quantity, unitPrice: item.unitPrice });
  };

  const saveEditItem = async () => {
    if (!editingItemId) return;
    await updateItem.mutateAsync({ itemId: editingItemId, data: editForm });
    setEditingItemId(null);
  };

  const cancelEditItem = () => setEditingItemId(null);

  const canSubmit =
    isTechnician &&
    (estimate.status === 'draft' || estimate.status === 'revision_requested');

  const canApproveReject =
    isAdmin && estimate.status === 'submitted';

  const canConvert =
    isAdmin && estimate.status === 'approved';

  const handleRequestRevision = async () => {
    await requestRevision.mutateAsync(revisionNotes || undefined);
    setRevisionNotes('');
    setShowRevisionForm(false);
  };

  const handleReject = async () => {
    await reject.mutateAsync(rejectReason || undefined);
    setRejectReason('');
    setShowRejectForm(false);
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <PageHeader
        title={estimate.estimateNumber}
        subtitle={`For: ${ticket?.title ?? 'Unknown Ticket'}`}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      {/* Status + action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
            ESTIMATE_STATUS_COLORS[estimate.status]
          )}
        >
          {ESTIMATE_STATUS_LABELS[estimate.status] ?? estimate.status}
        </span>

        {/* Technician: submit for review */}
        {canSubmit && (
          <Button
            size="sm"
            className="gap-2"
            onClick={() => submit.mutateAsync()}
            disabled={submit.isPending}
          >
            <Send className="h-4 w-4" />
            Submit for Review
          </Button>
        )}

        {/* Admin: approve */}
        {canApproveReject && (
          <Button
            size="sm"
            className="gap-2"
            onClick={() => approve.mutateAsync(undefined)}
            disabled={approve.isPending}
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </Button>
        )}

        {/* Admin: request revision */}
        {canApproveReject && !showRevisionForm && !showRejectForm && (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setShowRevisionForm(true)}
          >
            <RotateCcw className="h-4 w-4" />
            Request Revision
          </Button>
        )}

        {/* Admin: reject */}
        {canApproveReject && !showRevisionForm && !showRejectForm && (
          <Button
            size="sm"
            variant="destructive"
            className="gap-2"
            onClick={() => setShowRejectForm(true)}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        )}

        {/* Admin: convert approved estimate to invoice */}
        {canConvert && (
          <Button
            size="sm"
            className="gap-2"
            onClick={() => convertToInvoice.mutate({ estimateId: estimate._id })}
            disabled={convertToInvoice.isPending}
          >
            <FileText className="h-4 w-4" />
            Convert to Invoice
          </Button>
        )}
      </div>

      {/* Revision request form */}
      {showRevisionForm && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-sm text-amber-800">Request Revision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Describe what needs to be revised..."
              rows={3}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setShowRevisionForm(false); setRevisionNotes(''); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRequestRevision}
                disabled={requestRevision.isPending}
              >
                Send Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject form */}
      {showRejectForm && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-sm text-red-800">Reject Estimate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Reason for rejection (optional)..."
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={reject.isPending}
              >
                Confirm Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revision notes banner — shown when revision was requested */}
      {estimate.status === 'revision_requested' && estimate.revisionNotes && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-sm text-amber-800">Revision Requested</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-amber-900">{estimate.revisionNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Line items table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b text-left text-fixflow-muted">
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 text-right font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Unit Price</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                  {canEditItems && <th className="pb-2 w-16" />}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(estimate.items ?? []).map((item: EstimateItem) =>
                  editingItemId === item._id ? (
                    <tr key={item._id} className="bg-amber-50/50">
                      <td className="py-2 pr-2">
                        <Input
                          value={editForm.description}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Select value={editForm.type} onValueChange={(v) => setEditForm((f) => ({ ...f, type: v }))}>
                          <SelectTrigger className="h-8 text-sm w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="parts">Parts</SelectItem>
                            <SelectItem value="overhead">Overhead</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={0}
                          value={editForm.quantity}
                          onChange={(e) => setEditForm((f) => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))}
                          className="h-8 text-sm text-right w-20"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={editForm.unitPrice}
                          onChange={(e) => setEditForm((f) => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                          className="h-8 text-sm text-right w-24"
                        />
                      </td>
                      <td className="py-2 text-right font-medium text-fixflow-muted">
                        {formatCurrency(editForm.quantity * editForm.unitPrice)}
                      </td>
                      <td className="py-2 pl-2">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={saveEditItem} disabled={updateItem.isPending}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-fixflow-muted hover:text-destructive" onClick={cancelEditItem}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item._id}>
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 capitalize text-fixflow-muted">{item.type}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                      {canEditItems && (
                        <td className="py-3 pl-2">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-fixflow-muted hover:text-fixflow-primary" onClick={() => startEditItem(item)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <Separator className="my-4" />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-fixflow-muted">Subtotal</span>
              <span>{formatCurrency(estimate.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fixflow-muted">Tax</span>
              <span>{formatCurrency(estimate.tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatCurrency(estimate.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta */}
      <Card>
        <CardContent className="pt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-fixflow-muted">Created by</span>
            <span>{createdBy?.name ?? '—'}</span>
          </div>
          {ticket && (
            <div className="flex justify-between">
              <span className="text-fixflow-muted">Ticket</span>
              <button
                onClick={() => navigate(`/tickets/${typeof estimate.ticketId === 'string' ? estimate.ticketId : (estimate.ticketId as Ticket)._id}`)}
                className="text-fixflow-primary hover:underline"
              >
                {ticket.ticketNumber}
              </button>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-fixflow-muted">Created</span>
            <span>{formatDate(estimate.createdAt)}</span>
          </div>
          {estimate.approvedAt && (
            <div className="flex justify-between">
              <span className="text-fixflow-muted">Approved</span>
              <span>{formatDate(estimate.approvedAt)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {estimate.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{estimate.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
