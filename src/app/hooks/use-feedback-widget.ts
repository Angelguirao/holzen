import { useActionState, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { OpenFeedbackDetail } from '@/app/components/ErrorBoundary';
import {
  readPostHogSessionIdForFeedback,
  submitFeedbackAction,
  trackFeedbackSubmitted,
  type FeedbackCategory,
} from '@/features/user/public';

/**
 * App-shell feedback sheet (ErrorBoundary → holzen:open-feedback).
 */
export function useFeedbackWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('question');
  const [message, setMessage] = useState('');
  const [state, formAction, isPending] = useActionState(submitFeedbackAction, {});
  const [errorContext, setErrorContext] = useState<{
    sentryEventId?: string;
    errorStack?: string;
  }>({});

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<OpenFeedbackDetail>).detail;
      setCategory('bug');
      setErrorContext({
        sentryEventId: detail?.sentryEventId,
        errorStack: detail?.errorStack,
      });
      const prefix = detail?.errorMessage
        ? `${t('feedback.errorPrefill', {
            defaultValue: 'Something went wrong: {{message}}\n\nWhat were you doing when this happened?',
            message: detail.errorMessage,
          })}`
        : '';
      setMessage(prefix);
      setOpen(true);
    };
    window.addEventListener('holzen:open-feedback', handler);
    return () => {
      window.removeEventListener('holzen:open-feedback', handler);
    };
  }, [t]);

  const reset = () => {
    setMessage('');
    setErrorContext({});
    setCategory('question');
  };

  useEffect(() => {
    if (state.offlineQueued) {
      toast(t('feedback.savedOffline'), { description: t('feedback.savedOfflineDesc') });
      reset();
      setOpen(false);
    } else if (state.success) {
      trackFeedbackSubmitted(category);
      toast.success(t('feedback.sent'), { description: t('feedback.sentDesc') });
      reset();
      setOpen(false);
    } else if (state.error === 'send_failed') {
      toast.error(t('feedback.failedToSend'), { description: t('feedback.tryAgainLater') });
    }
  }, [state.success, state.offlineQueued, state.error, category, t]);

  return {
    t,
    open,
    setOpen,
    category,
    setCategory,
    message,
    setMessage,
    formAction,
    isPending,
    errorContext,
    setErrorContext,
    posthogSessionId: readPostHogSessionIdForFeedback(),
  };
}
