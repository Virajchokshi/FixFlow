import { useRef, useState } from 'react';
import { Upload, Paperclip, Trash2, FileText, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TicketAttachment, User } from '@/types';
import { formatFileSize, formatDateTime } from '@/lib/utils';

interface AttachmentUploadProps {
  attachments: TicketAttachment[];
  currentUser: User;
  onUpload: (file: File) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
}

interface PendingPreview {
  name: string;
  url: string;
  isImage: boolean;
}

export function AttachmentUpload({
  attachments,
  currentUser,
  onUpload,
  onDelete,
}: AttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingPreview | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPending({ name: file.name, url, isImage: file.type.startsWith('image/') });
    setUploading(true);

    try {
      await onUpload(file);
    } finally {
      URL.revokeObjectURL(url);
      setPending(null);
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((att) => {
            const uploader = typeof att.uploadedBy === 'object' ? att.uploadedBy as User : null;
            const isOwn = uploader?._id === currentUser._id;
            const isImage = att.mimetype.startsWith('image/');

            return (
              <li key={att._id} className="rounded-md border text-sm overflow-hidden">
                {isImage && att.storagePath && (
                  <a href={att.storagePath} download={att.originalName} target="_blank" rel="noreferrer">
                    <img
                      src={att.storagePath}
                      alt={att.originalName}
                      className="w-full max-h-48 object-contain bg-slate-50 border-b"
                    />
                  </a>
                )}
                <div className="flex items-center gap-3 p-3">
                  {isImage ? (
                    <Image className="h-4 w-4 text-blue-500 shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <a
                      href={att.storagePath}
                      download={att.originalName}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate font-medium hover:underline block"
                    >
                      {att.originalName}
                    </a>
                    <p className="text-xs text-fixflow-muted">
                      {formatFileSize(att.size)} · {uploader?.name ?? 'Unknown'} ·{' '}
                      {formatDateTime(att.createdAt)}
                    </p>
                  </div>
                  {(isOwn || currentUser.role === 'admin') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-fixflow-muted hover:text-destructive shrink-0"
                      onClick={() => onDelete(att._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pending upload preview */}
      {pending && (
        <div className="rounded-md border text-sm overflow-hidden opacity-70">
          {pending.isImage && (
            <img
              src={pending.url}
              alt={pending.name}
              className="w-full max-h-48 object-contain bg-slate-50 border-b"
            />
          )}
          <div className="flex items-center gap-3 p-3">
            {pending.isImage ? (
              <Image className="h-4 w-4 text-blue-400 shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span className="flex-1 truncate text-fixflow-muted">{pending.name}</span>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-fixflow-muted shrink-0" />
          </div>
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? 'Uploading…' : 'Upload File'}
        </Button>
        <p className="mt-1 text-xs text-fixflow-muted">Images and PDFs up to 10MB</p>
      </div>
    </div>
  );
}
