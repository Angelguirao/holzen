import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, Inbox, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { hapticFeedback } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface BulkHoldSuccessBodyProps {
  heldCount: number;
  onViewEchoes: () => void;
}

export function BulkHoldSuccessBody({ heldCount, onViewEchoes }: BulkHoldSuccessBodyProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="space-y-5 pt-2"
    >
      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-7 w-7 text-primary" aria-hidden />
        </div>
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-foreground">
          {t('bulkHold.successChosen', { defaultValue: 'You chose deliberately' })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('bulkHold.successHeldLine', {
            count: heldCount,
            defaultValue: 'Held through {{count}} pauses',
          })}
        </p>
        <p className="text-sm font-medium text-primary">
          {t('bulkHold.successConviction', {
            count: heldCount,
            defaultValue: '+{{count}} conviction',
          })}
        </p>
      </div>
      <div className={cn(homeInWidget.inset, 'space-y-3')}>
        <div className="flex items-start gap-2">
          <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {t('bulkHold.echoesCardTitle', { defaultValue: 'Echoes' })}
            </p>
            <p className={homeInWidget.metaFaint}>
              {t('bulkHold.echoesCardBody', {
                defaultValue: 'Revisit reflections and artifacts from these pauses in Echoes.',
              })}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-between rounded-xl border-primary/25 font-medium text-foreground"
          onClick={() => {
            hapticFeedback('light');
            onViewEchoes();
          }}
        >
          {t('bulkHold.viewEchoes', { defaultValue: 'View Echoes' })}
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </div>
    </motion.div>
  );
}
