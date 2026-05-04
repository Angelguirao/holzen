import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PauseDecide } from '@/components/pause/PauseDecide';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';
import { pauseLogStep } from '@/lib/pause-api';
import { buildOutcomeLoggedPayload } from '@/lib/pause-outcome-log-payload';
import { invalidatePauseStatsDataForUser } from '@/lib/pause-stats-invalidate';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/posthog';
import type { PauseArchiveRow } from '@/hooks/use-pause-archive-list';

type Props = {
  row: PauseArchiveRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
};

export function ArchivePauseRetrospectiveOutcomeSheet({ row, open, onOpenChange, onSuccess }: Props) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const id = row.id;

  const submit = useCallback(
    async (outcome: string) => {
      if (!id || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      try {
        hapticFeedback('medium');
        await pauseLogStep({
          instanceId: id,
          stepType: 'outcome_logged',
          payload: buildOutcomeLoggedPayload(outcome),
        });
        try {
          trackEvent('pause_outcome_retrospective', {
            pause_instance_id: id,
            outcome,
            surface: 'archive',
          });
        } catch {
          /* no-op */
        }
        void supabase.auth.getUser().then(({ data: { user } }) => {
          invalidatePauseStatsDataForUser(user?.id);
        });
        hapticFeedback('success');
        toast.success(
          t('archive.retrospectiveOutcomeSaved', { defaultValue: 'Decision saved for this pause.' }),
        );
        onOpenChange(false);
        await onSuccess?.();
      } catch {
        hapticFeedback('warning');
        toast.error(
          t('archive.retrospectiveOutcomeFailed', {
            defaultValue: 'Could not save — check your connection and try again.',
          }),
        );
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [id, onOpenChange, onSuccess, t],
  );

  const handleDecide = useCallback(
    (d: string) => {
      void submit(d);
    },
    [submit],
  );

  if (!id) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">
            {t('archive.retrospectiveSheetTitle', { defaultValue: 'Log your decision' })}
          </SheetTitle>
          <SheetDescription className="text-left text-sm leading-relaxed">
            {t('archive.retrospectiveSheetBody', {
              defaultValue:
                'This pause ended before you chose on the ritual screen. Your answer is saved for patterns and stats.',
            })}
          </SheetDescription>
        </SheetHeader>

        <div className={cn('mt-4 space-y-6 pb-6', submitting && 'pointer-events-none opacity-60')}>
          <PauseDecide
            onDecide={handleDecide}
            introKicker={t('archive.retrospectiveDecideKicker', { defaultValue: 'Archive' })}
          />
          <div className="flex flex-col items-center gap-2 border-t border-border/30 pt-4">
            <p className="text-center text-xs text-muted-foreground">
              {t('archive.retrospectiveNothingHint', {
                defaultValue: 'If you did not buy or sell during this window:',
              })}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={submitting}
              onClick={() => void submit('nothing')}
            >
              {t('archive.retrospectiveNothingCta', { defaultValue: 'No trade / skipped' })}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
