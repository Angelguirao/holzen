import { invokeEdge } from '@/lib/invoke-edge';

export type SendFeedbackBody = Record<string, unknown>;

/** Posts user feedback to Slack via `send-feedback` edge (`invokeEdge` preserves `x-cid`). */
export function sendFeedback(body: SendFeedbackBody) {
  return invokeEdge('send-feedback', { body });
}
