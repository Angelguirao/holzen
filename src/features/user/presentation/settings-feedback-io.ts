/**
 * Settings / shell feedback form action (edge send-feedback + offline queue).
 */
import { sendFeedback } from '@/features/user/infrastructure/edge/send-feedback-edge';
import { enqueueAction } from '@/lib/offline-queue';
import { getCid } from '@/lib/cid';

declare const __APP_VERSION__: string;

export type FeedbackActionState = {
  error?: 'empty' | 'send_failed';
  success?: boolean;
  offlineQueued?: boolean;
};

export async function submitFeedbackAction(
  _prev: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const category = String(formData.get('category') ?? 'question');
  const message = String(formData.get('message') ?? '').trim();
  if (!message) {
    return { error: 'empty' };
  }

  const sentryEventId = String(formData.get('sentry_event_id') ?? '').trim();
  const errorStack = String(formData.get('error_stack') ?? '').trim();
  const posthogSessionId = String(formData.get('posthog_session_id') ?? '').trim();

  const payload = {
    category,
    message,
    page: `${window.location.pathname}${window.location.search}`,
    user_agent: navigator.userAgent,
    cid: getCid(),
    app_version: __APP_VERSION__,
    ...(sentryEventId ? { sentry_event_id: sentryEventId } : {}),
    ...(errorStack ? { error_stack: errorStack } : {}),
    ...(posthogSessionId ? { posthog_session_id: posthogSessionId } : {}),
  };

  if (!navigator.onLine) {
    enqueueAction('feedback', payload);
    return { success: true, offlineQueued: true };
  }

  const { error } = await sendFeedback(payload);
  if (error) {
    return { error: 'send_failed' };
  }

  return { success: true };
}
