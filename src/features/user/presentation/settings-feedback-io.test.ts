import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.stubGlobal('__APP_VERSION__', '1.0.0-test');

import { submitFeedbackAction } from './settings-feedback-io';

vi.mock('@/features/user/infrastructure/edge/send-feedback-edge', () => ({
  sendFeedback: vi.fn(),
}));

vi.mock('@/lib/offline-queue', () => ({
  enqueueAction: vi.fn(),
}));

vi.mock('@/lib/cid', () => ({
  getCid: () => 'test-cid',
}));

import { sendFeedback } from '@/features/user/infrastructure/edge/send-feedback-edge';
import { enqueueAction } from '@/lib/offline-queue';

describe('submitFeedbackAction', () => {
  beforeEach(() => {
    vi.mocked(sendFeedback).mockReset();
    vi.mocked(enqueueAction).mockReset();
  });

  it('rejects empty message', async () => {
    const formData = new FormData();
    formData.set('category', 'bug');
    formData.set('message', '   ');
    await expect(submitFeedbackAction({}, formData)).resolves.toEqual({ error: 'empty' });
  });

  it('queues offline feedback when navigator is offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const formData = new FormData();
    formData.set('category', 'question');
    formData.set('message', 'Hello');
    await expect(submitFeedbackAction({}, formData)).resolves.toEqual({
      success: true,
      offlineQueued: true,
    });
    expect(enqueueAction).toHaveBeenCalledWith(
      'feedback',
      expect.objectContaining({ category: 'question', message: 'Hello', cid: 'test-cid' }),
    );
  });

  it('returns success when sendFeedback succeeds', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    vi.mocked(sendFeedback).mockResolvedValueOnce({ error: null });
    const formData = new FormData();
    formData.set('category', 'feature');
    formData.set('message', 'Nice app');
    await expect(submitFeedbackAction({}, formData)).resolves.toEqual({ success: true });
  });

  it('forwards optional error-boundary diagnostic fields', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    vi.mocked(sendFeedback).mockResolvedValueOnce({ error: null });
    const formData = new FormData();
    formData.set('category', 'bug');
    formData.set('message', 'Crash on Home');
    formData.set('sentry_event_id', 'evt-1');
    formData.set('error_stack', 'Error: boom');
    formData.set('posthog_session_id', 'ph-sess');
    await expect(submitFeedbackAction({}, formData)).resolves.toEqual({ success: true });
    expect(sendFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        sentry_event_id: 'evt-1',
        error_stack: 'Error: boom',
        posthog_session_id: 'ph-sess',
      }),
    );
  });

  it('surfaces send failures', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    vi.mocked(sendFeedback).mockResolvedValueOnce({ error: new Error('network') });
    const formData = new FormData();
    formData.set('category', 'bug');
    formData.set('message', 'Broken');
    await expect(submitFeedbackAction({}, formData)).resolves.toEqual({ error: 'send_failed' });
  });
});
