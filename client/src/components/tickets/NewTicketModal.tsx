import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload, X, ImageIcon, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AIAnalysisSuggestion } from '@/components/tickets/AIAnalysisSuggestion';
import { createTicketSchema, CreateTicketFormData } from '@/lib/validations';
import { useCreateTicket } from '@/hooks/useTickets';
import { aiApi, AI_ANALYSIS_ENABLED } from '@/api/ai.api';
import { AIAnalysis, TicketCategory } from '@/types';

interface NewTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE_MB = 5;

export function NewTicketModal({ open, onOpenChange }: NewTicketModalProps) {
  const navigate = useNavigate();
  const createTicket = useCreateTicket();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
  });

  const selectedCategory = useWatch({ control, name: 'category' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    if (!file.type.startsWith('image/')) {
      setImageError('Only image files are allowed (JPEG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setImageError(`Image must be smaller than ${MAX_FILE_SIZE_MB} MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      setFileName(file.name);
      setValue('imageBase64', base64, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview(null);
    setFileName(null);
    setImageError(null);
    setAnalysis(null);
    setValue('imageBase64', '', { shouldValidate: false });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!preview) return;
    setIsAnalyzing(true);
    try {
      const result = await aiApi.analyzeImage(preview);
      setAnalysis(result);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Analysis failed — please try again');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
      clearImage();
      setAnalysis(null);
    }
    onOpenChange(open);
  };

  const onSubmit = async (data: CreateTicketFormData) => {
    const result = await createTicket.mutateAsync(
      analysis ? { ...data, aiAnalysis: analysis } : data
    );
    handleClose(false);
    navigate(`/tickets/${result.data._id}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Maintenance Request</DialogTitle>
          <DialogDescription>
            Fill in the details below and attach an image of the issue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue..."
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about the maintenance issue..."
              rows={4}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select
              value={selectedCategory || ''}
              onValueChange={(v) =>
                setValue('category', v as CreateTicketFormData['category'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* AI Analysis suggestion card */}
          {analysis && (
            <AIAnalysisSuggestion
              analysis={analysis}
              onApply={(category: TicketCategory) =>
                setValue('category', category, { shouldValidate: true })
              }
            />
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="Building A, Floor 3, Room 302..."
              {...register('location')}
            />
            {errors.location && (
              <p className="text-xs text-destructive">{errors.location.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>
              Issue Image <span className="text-destructive">*</span>
            </Label>

            {preview ? (
              <div className="space-y-2">
                <div className="rounded-lg border overflow-hidden bg-slate-50">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-48 object-contain"
                  />
                  <div className="flex items-center justify-between px-3 py-2 bg-white border-t text-xs text-slate-600">
                    <span className="truncate">{fileName}</span>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="ml-2 shrink-0 text-slate-400 hover:text-destructive transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {AI_ANALYSIS_ENABLED && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 border-violet-300 text-violet-700 hover:bg-violet-50"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Wand2 className="h-3.5 w-3.5" />}
                    {isAnalyzing ? 'Analysing...' : analysis ? 'Re-analyse' : 'Analyse with AI'}
                  </Button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-sm text-slate-500 hover:border-slate-400 hover:bg-slate-100 transition-colors"
              >
                <ImageIcon className="h-8 w-8 text-slate-300" />
                <span>
                  <span className="font-medium text-slate-700">Click to upload</span> an image
                </span>
                <span className="text-xs text-slate-400">
                  JPEG, PNG, GIF, WebP — max {MAX_FILE_SIZE_MB} MB
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {imageError && (
              <p className="text-xs text-destructive">{imageError}</p>
            )}
            {errors.imageBase64 && !imageError && (
              <p className="text-xs text-destructive">{errors.imageBase64.message}</p>
            )}

            {!preview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Browse file
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={createTicket.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTicket.isPending}>
              {createTicket.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
