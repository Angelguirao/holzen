import { Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { hapticFeedback } from '@/lib/haptics';

export type SignalReadFullStoryButtonProps = {
  pauseInstanceId: string;
};

/** Frame Signal CTA — Figma "Read the full story" pill + maximize icon (435:16214). */
export function SignalReadFullStoryButton({ pauseInstanceId }: SignalReadFullStoryButtonProps) {
  "use memo";
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
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
