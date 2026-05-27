import { Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { hapticFeedback } from '@/lib/haptics';
import { cn } from '@/lib/utils';

export type SignalReadFullStoryButtonProps = {
  pauseInstanceId: string;
  className?: string;
};

/** Frame / inline Signal CTA — Figma "Read the full story" + maximize icon. */
export function SignalReadFullStoryButton({ pauseInstanceId, className }: SignalReadFullStoryButtonProps) {
  "use memo";
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={cn(
        'inline-flex w-full items-center justify-center gap-1.5 py-4 text-sm font-medium text-primary transition-colors hover:text-primary/80',
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        hapticFeedback('light');
        navigate(`/companion/signal/${pauseInstanceId}`, { state: { from: 'pause' } });
      }}
    >
      {t('companions.readFullStory')}
      <Maximize2 className="h-5 w-5 shrink-0" aria-hidden />
    </button>
  );
}
