import { RefreshCw, BookOpenText, Anchor, Clock, Mountain, Feather, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const COMPANION_EMPTY_STATES: Record<string, { icon: React.ElementType; message: string; hint: string }> = {
  signal: {
    icon: BookOpenText,
    message: 'No philosophical insight available right now.',
    hint: 'Timeless Bitcoin thinking from the best minds — coming shortly.',
  },
  grounding: {
    icon: Anchor,
    message: 'Grounding research is taking a moment.',
    hint: 'Behavioral science to anchor your thinking — try again in a few seconds.',
  },
  history: {
    icon: Clock,
    message: 'Historical parallel unavailable.',
    hint: 'Financial history rhymes — we\'ll find the right echo next time.',
  },
  zoomOut: {
    icon: Mountain,
    message: 'Zoom out view couldn\'t load.',
    hint: 'Perspective needs a moment to gather — your past pauses and prices will appear here.',
  },
  haiku: {
    icon: Feather,
    message: 'Haiku couldn\'t be composed.',
    hint: 'A poetic mirror for this moment — try refreshing.',
  },
  intervention: {
    icon: Sparkles,
    message: 'Couldn\'t load this perspective.',
    hint: 'The companion service may be unavailable or missing server configuration (e.g. API keys). Try again in a moment.',
  },
};

interface Props {
  message?: string;
  companionType?: string;
  onRetry?: () => void;
}

/** Legacy library `source_type`; same empty state as Ground companion. */
function normalizeCompanionType(type: string | undefined): string | undefined {
  if (!type) return undefined;
  return type === 'learning' ? 'grounding' : type;
}

export function CompanionError({ message, companionType, onRetry }: Props) {
  const { t } = useTranslation();
  const key = normalizeCompanionType(companionType);
  const empty = key ? COMPANION_EMPTY_STATES[key] : null;
  const Icon = empty?.icon;

  return (
    <div className="rounded-lg border border-border/20 bg-muted/10 px-4 py-3.5 space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />}
        <p className="text-xs text-muted-foreground/60">
          {message ?? empty?.message ?? t('companions.loadError', 'Couldn\'t load right now.')}
        </p>
      </div>
      {empty?.hint && (
        <p className="text-[10px] text-muted-foreground/35 leading-relaxed">
          {empty.hint}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-[10px] font-mono text-primary/60 hover:text-primary transition-colors active:scale-[0.97]"
        >
          <RefreshCw className="h-3 w-3" />
          {t('common.retry', 'Try again')}
        </button>
      )}
    </div>
  );
}
