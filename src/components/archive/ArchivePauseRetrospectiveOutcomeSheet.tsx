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
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';
import { pauseLogStep } from '@/features/pause/public-rpc';
import { buildOutcomeLoggedPayload } from '@/features/pause/public';
import { invalidatePauseStatsDataForUser } from '@/features/pause/application/queries/invalidate-pause-stats';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/posthog';
import type { PauseArchiveRow } from '@/features/pause/public-queries';

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
                'This pause ended (expired or dismissed) before you finished Decide on the ritual screen. Your answer is saved for patterns and stats; the row stays expired or dismissed.',
            })}
          </SheetDescription>
        </SheetHeader>

        <div className={cn('mt-4 space-y-6 pb-6', submitting && 'pointer-events-none opacity-60')}>
          <PauseDecide
            onDecide={handleDecide}
            introKicker={t('archive.retrospectiveDecideKicker', { defaultValue: 'Archive' })}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
