import { invokeEdge } from '@/lib/invoke-edge';

export type RecordReferralResponse = { ok?: boolean; reason?: string };

/** Apply referral code after sign-in (`record-referral` edge — legacy, undeployed). */
export function invokeRecordReferral(referralCode: string) {
  return invokeEdge<RecordReferralResponse>('record-referral', {
    body: { referral_code: referralCode },
  });
}
