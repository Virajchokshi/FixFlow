import { Wand2, Clock, Wrench, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AIAnalysis, TicketCategory } from '@/types';
import { CATEGORY_LABELS, PRIORITY_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface AIAnalysisSuggestionProps {
  analysis: AIAnalysis;
  /** When provided, shows "Apply Suggestions" button (form context).
   *  When undefined, renders read-only (ticket detail context). */
  onApply?: (category: TicketCategory) => void;
}

function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (!Number.isFinite(confidence)) return null;
  const pct = Math.round((confidence as number) * 100);
  const color =
    pct >= 80 ? 'text-green-600' : pct >= 55 ? 'text-amber-600' : 'text-slate-400';
  return (
    <span className={cn('text-xs font-medium tabular-nums', color)}>
      {pct}% confidence
    </span>
  );
}

export function AIAnalysisSuggestion({ analysis, onApply }: AIAnalysisSuggestionProps) {
  return (
    <Card className="border-violet-200 bg-violet-50/40">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-violet-700">
            <Wand2 className="h-4 w-4" />
            AI Analysis
          </CardTitle>
          <ConfidenceBadge confidence={analysis.confidence} />
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Issue summary */}
        {(analysis.issueType || analysis.description) && (
          <div>
            {analysis.issueType && (
              <p className="text-sm font-semibold">{analysis.issueType}</p>
            )}
            {analysis.description && (
              <p className="text-xs text-fixflow-muted mt-0.5 leading-relaxed">{analysis.description}</p>
            )}
          </div>
        )}

        {/* Category + severity */}
        <div className="flex items-center gap-2 flex-wrap">
          {analysis.category && (
            <Badge variant="outline" className="text-xs capitalize border-violet-200 text-violet-700">
              {CATEGORY_LABELS[analysis.category] ?? analysis.category}
            </Badge>
          )}
          {analysis.severity && (
            <Badge className={cn('text-xs capitalize', PRIORITY_COLORS[analysis.severity] ?? 'bg-slate-100 text-slate-700')}>
              {analysis.severity} severity
            </Badge>
          )}
          {analysis.estimatedRepairTime && (
            <span className="flex items-center gap-1 text-xs text-fixflow-muted">
              <Clock className="h-3 w-3" />
              {analysis.estimatedRepairTime}
            </span>
          )}
        </div>

        <Separator className="bg-violet-100" />

        {/* Required tools */}
        {(analysis.requiredTools ?? []).length > 0 && (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-fixflow-muted uppercase tracking-wide">
              <Wrench className="h-3 w-3" />
              Required Tools
            </p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.requiredTools.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center rounded-md bg-white border border-violet-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Safety precautions */}
        {(analysis.safetyPrecautions ?? []).length > 0 && (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-fixflow-muted uppercase tracking-wide">
              <ShieldAlert className="h-3 w-3" />
              Safety
            </p>
            <ul className="space-y-0.5">
              {analysis.safetyPrecautions.map((note) => (
                <li key={note} className="flex items-start gap-1.5 text-xs text-slate-600">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Apply button — only in form context */}
        {onApply && analysis.category && (
          <>
            <Separator className="bg-violet-100" />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full gap-2 border-violet-300 text-violet-700 hover:bg-violet-100"
              onClick={() => onApply(analysis.category!)}
            >
              <Wand2 className="h-3.5 w-3.5" />
              Apply Category Suggestion
            </Button>
            <p className="text-xs text-fixflow-muted text-center -mt-1">
              Priority is set by admin after review
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
