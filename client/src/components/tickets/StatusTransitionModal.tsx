import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateStatusSchema, UpdateStatusFormData } from '@/lib/validations';
import { STATUS_LABELS } from '@/lib/constants';
import { TicketStatus } from '@/types';

interface StatusTransitionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (status: TicketStatus, reason?: string) => Promise<void>;
  validTransitions: TicketStatus[];
  currentStatus: TicketStatus;
}

export function StatusTransitionModal({
  open,
  onClose,
  onSubmit,
  validTransitions,
  currentStatus,
}: StatusTransitionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('');
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!selectedStatus) return;
    setIsSubmitting(true);
    try {
      await onSubmit(selectedStatus as TicketStatus, reason || undefined);
      onClose();
      setSelectedStatus('');
      setReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Ticket Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Current Status</Label>
            <p className="text-sm font-medium text-fixflow-muted">{STATUS_LABELS[currentStatus]}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-status">New Status *</Label>
            <Select
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as TicketStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status..." />
              </SelectTrigger>
              <SelectContent>
                {validTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Add a reason for this status change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedStatus || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
