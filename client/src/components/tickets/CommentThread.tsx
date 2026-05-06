import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { addCommentSchema, AddCommentFormData } from '@/lib/validations';
import { TicketComment, User } from '@/types';
import { formatDateTime } from '@/lib/utils';

interface CommentThreadProps {
  comments: TicketComment[];
  currentUser: User;
  onAdd: (body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

export function CommentThread({ comments, currentUser, onAdd, onDelete }: CommentThreadProps) {
  const [isAdding, setIsAdding] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCommentFormData>({
    resolver: zodResolver(addCommentSchema),
  });

  const onSubmit = async (data: AddCommentFormData) => {
    setIsAdding(true);
    try {
      await onAdd(data.body);
      reset();
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-fixflow-muted">No comments yet. Be the first to add one.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const author = typeof comment.authorId === 'object' ? comment.authorId as User : null;
            const authorName = author?.name ?? 'Unknown';
            const isOwn = author?._id === currentUser._id;

            return (
              <div key={comment._id} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs bg-fixflow-primary text-white uppercase">
                    {authorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-medium">{authorName}</span>
                      <span className="ml-2 text-xs text-fixflow-muted">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    {(isOwn || currentUser.role === 'admin') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-fixflow-muted hover:text-destructive"
                        onClick={() => onDelete(comment._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{comment.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 pt-2 border-t">
        <Textarea
          {...register('body')}
          placeholder="Add a comment..."
          rows={3}
          className="resize-none"
        />
        {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isAdding}>
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Comment
          </Button>
        </div>
      </form>
    </div>
  );
}
