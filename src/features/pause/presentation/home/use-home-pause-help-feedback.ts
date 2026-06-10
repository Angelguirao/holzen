import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/public';
import {
  buildPauseHelpFeedbackMessage,
  localCalendarYmd,
  PAUSE_HELP_FEEDBACK_MAX_DEFERRALS,
  shouldShowPauseHelpFeedback,
} from '@/features/pause/domain/home/pause-help-feedback-eligibility';
import { parseHomePauseHelpFeedbackLocationState } from '@/features/pause/domain/home/home-location-state';
import {
  readPauseHelpFeedbackStorage,
  writePauseHelpFeedbackStorage,
} from '@/features/pause/public-queries';
import { sendFeedback } from '@/features/user/infrastructure/edge/send-feedback-edge';
import { trackEvent } from '@/lib/posthog';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export type UseHomePauseHelpFeedbackOptions = {
  /** Do not stack on top of Customize or other Home sheets. */
  blocked?: boolean;
};

export function useHomePauseHelpFeedback({ blocked = false }: UseHomePauseHelpFeedbackOptions = {}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const consumedNavRef = useRef(false);
  const pendingPauseInstanceIdRef = useRef<string | null>(null);

  const [open, setOpen] = useState(false);
  const [pauseInstanceId, setPauseInstanceId] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isPending, startTransition] = useTransition();

  const clearNavState = useCallback(() => {
    if (!location.state) return;
    navigate('.', { replace: true, state: null });
  }, [location.state, navigate]);

  useEffect(() => {
    if (consumedNavRef.current || !user?.id) return;

    const parsed = parseHomePauseHelpFeedbackLocationState(location.state);
    if (!parsed) return;

    consumedNavRef.current = true;
    clearNavState();
    pendingPauseInstanceIdRef.current = parsed.pauseInstanceId;
  }, [clearNavState, location.state, user?.id]);

  useEffect(() => {
    if (blocked || !user?.id) return;

    const pendingId = pendingPauseInstanceIdRef.current;
    if (!pendingId) return;

    const storage = readPauseHelpFeedbackStorage(user.id);
    if (!shouldShowPauseHelpFeedback({ userId: user.id, pauseInstanceId: pendingId, storage })) {
      pendingPauseInstanceIdRef.current = null;
      return;
    }

    pendingPauseInstanceIdRef.current = null;

    const today = localCalendarYmd(new Date());
    writePauseHelpFeedbackStorage(user.id, {
      ...storage,
      lastPromptLocalDate: today,
      lastPromptPauseInstanceId: pendingId,
    });

    setPauseInstanceId(pendingId);
    setOpen(true);
    trackEvent('home.pause_help_feedback_shown', {
      pause_instance_id: pendingId,
    });
  }, [blocked, user?.id]);

  const closeSheet = useCallback(() => {
    setOpen(false);
    setPauseInstanceId(null);
  }, []);

  const recordDeferral = useCallback(
    (event: 'home.pause_help_feedback_deferred' | 'home.pause_help_feedback_dismissed') => {
      if (!user?.id || !pauseInstanceId) {
        closeSheet();
        return;
      }

      const storage = readPauseHelpFeedbackStorage(user.id);
      const deferralCount = storage.deferralCount + 1;
      const optedOut = deferralCount >= PAUSE_HELP_FEEDBACK_MAX_DEFERRALS;

      writePauseHelpFeedbackStorage(user.id, {
        ...storage,
        deferredPauseIds: storage.deferredPauseIds.includes(pauseInstanceId)
          ? storage.deferredPauseIds
          : [...storage.deferredPauseIds, pauseInstanceId],
        deferralCount,
        optedOut,
      });

      trackEvent(event, {
        pause_instance_id: pauseInstanceId,
        deferral_count: deferralCount,
        opted_out: optedOut,
      });

      closeSheet();
    },
    [closeSheet, pauseInstanceId, user?.id],
  );

  const dismissSheet = useCallback(() => {
    recordDeferral('home.pause_help_feedback_dismissed');
  }, [recordDeferral]);

  const deferSheet = useCallback(() => {
    recordDeferral('home.pause_help_feedback_deferred');
  }, [recordDeferral]);

  const submitFeedback = useCallback(
    (rating: number, comment: string) => {
      if (!user?.id || !pauseInstanceId || rating < 1 || rating > 5) return;

      startTransition(async () => {
        try {
          await sendFeedback({
            category: 'pause_help',
            message: buildPauseHelpFeedbackMessage(rating, comment),
            page: '/',
            pause_instance_id: pauseInstanceId,
            rating,
          });

          const storage = readPauseHelpFeedbackStorage(user.id);
          writePauseHelpFeedbackStorage(user.id, {
            ...storage,
            ratedPauseIds: storage.ratedPauseIds.includes(pauseInstanceId)
              ? storage.ratedPauseIds
              : [...storage.ratedPauseIds, pauseInstanceId],
            lastSubmittedAt: new Date().toISOString(),
          });

          trackEvent('home.pause_help_feedback_submitted', {
            pause_instance_id: pauseInstanceId,
            rating,
            has_comment: Boolean(comment.trim()),
          });

          closeSheet();
          setShowThankYou(true);
        } catch {
          toast.error(t('home.pauseHelpFeedback.submitFailed'));
          closeSheet();
        }
      });
    },
    [closeSheet, pauseInstanceId, startTransition, t, user?.id],
  );

  const dismissThankYou = useCallback(() => {
    setShowThankYou(false);
  }, []);

  return {
    sheetOpen: open,
    showThankYou,
    submitting: isPending,
    onSheetOpenChange: (next: boolean) => {
      if (!next) dismissSheet();
      else setOpen(true);
    },
    onDefer: deferSheet,
    onSubmit: submitFeedback,
    onDismissThankYou: dismissThankYou,
  };
}
