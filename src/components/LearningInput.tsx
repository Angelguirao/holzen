import { Loader2, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NudgeData {
  title: string;
  body: string;
  citation: string;
  url: string;
}

interface Props {
  title: string;
  body: string;
  nudge?: NudgeData | null;
  nudgeLoading?: boolean;
  nudgeError?: boolean;
}

export function LearningInput({ title, body, nudge, nudgeLoading = false, nudgeError = false }: Props) {
  const { t } = useTranslation();
  const hasNudgeSystem = nudge !== undefined || nudgeLoading || nudgeError;
  const displayTitle = nudge?.title ?? (!hasNudgeSystem || nudgeError ? title : '');
  const displayBody = nudge?.body ?? (!hasNudgeSystem || nudgeError ? body : '');

  if (nudgeLoading) {
    return (
      <div className="py-3 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs font-mono">{t('learning.findingResearch')}</span>
      </div>
    );
  }

  if (!displayTitle && !displayBody) return null;

  return (
    <div className="py-3 space-y-1.5">
      <p className="text-xs font-mono font-medium text-foreground/80">{displayTitle}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{displayBody}</p>
      {nudge?.citation && (
        <div className="flex items-center gap-1.5 pt-1">
          <p className="text-[9px] font-mono text-muted-foreground/40">
            {nudge.citation}
          </p>
          {nudge.url && (
            <a
              href={nudge.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/50 hover:text-primary transition-colors"
              aria-label={t('learning.viewResearch')}
            >
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      )}
      {nudgeError && !nudge && (
        <p className="text-[9px] font-mono text-muted-foreground/30 pt-1">
          {t('learning.researchGrounded')}
        </p>
      )}
    </div>
  );
}
