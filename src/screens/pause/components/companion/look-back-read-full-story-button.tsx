import { Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { hapticFeedback } from '@/lib/haptics';
import { cn } from '@/lib/utils';

export type LookBackReadFullStoryButtonProps = {
  pauseInstanceId: string;
  className?: string;
};

/** Frame Look back CTA — Figma "Read the full story" pill + maximize icon. */
export function LookBackReadFullStoryButton({ pauseInstanceId, className }: LookBackReadFullStoryButtonProps) {
  "use memo";
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15',
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        hapticFeedback('light');
        navigate(`/companion/history/${pauseInstanceId}`, { state: { from: 'pause' } });
      }}
    >
      {t('companions.readFullStory')}
      <Maximize2 className="h-5 w-5 shrink-0" aria-hidden />
    </button>
  );
}
