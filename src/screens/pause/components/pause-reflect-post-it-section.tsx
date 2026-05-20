import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CirclePlus } from 'lucide-react';
import { PauseNote } from '@/screens/pause/components/PauseNote';
import { PauseTags } from '@/screens/pause/components/PauseTags';
import { usePauseReflectUiTelemetry } from '@/features/pause/public-hooks';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';

export type PauseReflectPostItSectionProps = {
  pauseInstanceId: string;
};

/** Pro reflect: optional post-it note and tags (expandable). */
export function PauseReflectPostItSection({ pauseInstanceId }: PauseReflectPostItSectionProps) {
  const { t } = useTranslation();
  const [postItOpen, setPostItOpen] = useState(false);
  const { onPostItOpen } = usePauseReflectUiTelemetry(pauseInstanceId, 'pause_reflect');

  const openPostIt = useCallback(() => {
    hapticFeedback('light');
    setPostItOpen(true);
    onPostItOpen();
  }, [onPostItOpen]);

  return (
    <div className="mt-5 space-y-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full rounded-full border border-primary/30 bg-primary/10 font-medium text-primary shadow-none hover:bg-primary/15 sm:w-auto"
        onClick={openPostIt}
      >
        <CirclePlus className="mr-2 h-4 w-4" aria-hidden />
        {t('pause.reflect.addPostIt', { defaultValue: 'Add your post-it' })}
      </Button>
      {postItOpen ? (
        <motion.div
          className="space-y-4 border-t border-border/30 pt-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <PauseNote pauseInstanceId={pauseInstanceId} />
          <PauseTags pauseInstanceId={pauseInstanceId} />
        </motion.div>
      ) : null}
    </div>
  );
}
