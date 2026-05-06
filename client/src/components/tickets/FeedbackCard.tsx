import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFeedback, useSubmitFeedback } from '@/hooks/useFeedback';
import { Feedback, User } from '@/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface FeedbackCardProps {
  ticketId: string;
  submittedBy: User | string;
  assignedTo: User | string;
  currentUserId: string;
}

function StarRating({
  value,
  onChange,
  readonly,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn('transition-colors', readonly ? 'cursor-default' : 'cursor-pointer')}
        >
          <Star
            className={cn(
              'h-6 w-6',
              star <= display ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ExistingFeedback({ feedback }: { feedback: Feedback }) {
  const techName =
    typeof feedback.technicianId === 'object'
      ? (feedback.technicianId as User).name
      : 'the technician';

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-700">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          Your Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        <div className="flex items-center gap-3">
          <StarRating value={feedback.rating} readonly />
          <span className="text-sm font-medium">{feedback.rating}/5</span>
          <span className="text-xs text-slate-400">for {techName}</span>
        </div>
        {feedback.comment && (
          <p className="text-sm text-slate-600 italic">"{feedback.comment}"</p>
        )}
        <p className="text-xs text-slate-400">{formatDate(feedback.createdAt)}</p>
      </CardContent>
    </Card>
  );
}

export function FeedbackCard({ ticketId, submittedBy, assignedTo, currentUserId }: FeedbackCardProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data, isLoading } = useFeedback(ticketId);
  const submit = useSubmitFeedback(ticketId);

  // Only the ticket submitter can leave feedback
  const submitterId = typeof submittedBy === 'object' ? (submittedBy as User)._id : submittedBy;
  if (submitterId !== currentUserId) return null;

  if (isLoading) return null;

  if (data?.data) return <ExistingFeedback feedback={data.data} />;

  const techName =
    typeof assignedTo === 'object' ? (assignedTo as User).name : 'the technician';

  const handleSubmit = () => {
    if (rating === 0) return;
    submit.mutate({ rating, comment: comment.trim() || undefined });
  };

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-700">
          <Star className="h-4 w-4" />
          Rate your experience
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <p className="text-sm text-slate-600">
          How was the service provided by <span className="font-medium">{techName}</span>?
        </p>
        <StarRating value={rating} onChange={setRating} />
        <Textarea
          placeholder="Optional comment (max 1000 characters)..."
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="text-sm resize-none"
        />
        <Button
          size="sm"
          disabled={rating === 0 || submit.isPending}
          onClick={handleSubmit}
          className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
        >
          {submit.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Submit Rating
        </Button>
      </CardContent>
    </Card>
  );
}
