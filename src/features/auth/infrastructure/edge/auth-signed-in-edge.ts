import { invokeEdge } from '@/lib/invoke-edge';

export type SendWelcomeEmailBody = {
  templateName: 'welcome';
  recipientEmail: string;
  idempotencyKey: string;
  templateData: { firstName?: string };
};

export type RecordReferralResponse = { ok?: boolean; reason?: string };

/** Welcome template via `send-transactional-email` edge (`invokeEdge` preserves `x-cid`). */
export function sendWelcomeTransactionalEmail(body: SendWelcomeEmailBody) {
  return invokeEdge('send-transactional-email', { body });
}

/** Apply referral code after sign-in (`record-referral` edge). */
export function invokeRecordReferral(referralCode: string) {
  return invokeEdge<RecordReferralResponse>('record-referral', {
    body: { referral_code: referralCode },
  });
}
