import { sendFeedback } from '@/features/user/public-rpc';
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

  const payload = {
    category,
    message,
    page: `${window.location.pathname}${window.location.search}`,
    user_agent: navigator.userAgent,
    cid: getCid(),
    app_version: __APP_VERSION__,
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
