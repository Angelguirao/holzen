import { invokeEdge } from '@/lib/invoke-edge';

export type SendWelcomeEmailBody = {
  templateName: 'welcome';
  recipientEmail: string;
  idempotencyKey: string;
  templateData: { firstName?: string };
};

/** Welcome template via `send-transactional-email` edge (`invokeEdge` preserves `x-cid`). */
export function sendWelcomeTransactionalEmail(body: SendWelcomeEmailBody) {
  return invokeEdge('send-transactional-email', { body });
}
