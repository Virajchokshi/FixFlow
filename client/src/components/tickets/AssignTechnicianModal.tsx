import { useState } from 'react';
import { Loader2, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { TechnicianProfile } from '@/types';
import { cn } from '@/lib/utils';

interface AssignTechnicianModalProps {
  open: boolean;
  onClose: () => void;
  onAssign: (technicianId: string) => Promise<void>;
  technicians: TechnicianProfile[];
  isLoading?: boolean;
}

const AVAILABILITY_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  busy: 'bg-amber-100 text-amber-700',
  off: 'bg-slate-100 text-slate-700',
};

export function AssignTechnicianModal({
  open,
  onClose,
  onAssign,
  technicians,
  isLoading,
}: AssignTechnicianModalProps) {
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const handleAssign = async (techId: string) => {
    setAssigningId(techId);
    try {
      await onAssign(techId);
      onClose();
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Assign Technician</SheetTitle>
          <SheetDescription>
            Select a technician to assign to this ticket.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-fixflow-muted" />
            </div>
          ) : technicians.length === 0 ? (
            <p className="text-sm text-fixflow-muted">No technicians available.</p>
          ) : (
            technicians.map((tech) => {
              const user = typeof tech.userId === 'object' ? tech.userId as any : null;
              const techId = tech._id;

              return (
                <div
                  key={techId}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fixflow-primary/10">
                      <User className="h-4 w-4 text-fixflow-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user?.name ?? 'Unknown'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-fixflow-muted">{tech.specialization}</span>
                        <span className="text-xs text-fixflow-muted">·</span>
                        <span className="text-xs text-fixflow-muted flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {tech.currentWorkload} active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        AVAILABILITY_COLORS[tech.availability]
                      )}
                    >
                      {tech.availability}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAssign(user?._id)}
                      disabled={!!assigningId || tech.availability === 'off'}
                    >
                      {assigningId === user?._id && (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      )}
                      Assign
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
