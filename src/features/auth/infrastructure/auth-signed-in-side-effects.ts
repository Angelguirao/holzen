import type { User } from '@supabase/supabase-js';
import {
  sendWelcomeTransactionalEmail,
} from './edge/auth-signed-in-edge';
import { holzenLog } from '@/lib/holzen-console';

/** Welcome email on first sign-in within ~10 minutes of account creation. */
export async function runWelcomeEmailOnSignedIn(user: User): Promise<void> {
  const sentKey = `holzen_welcome_sent_${user.id}`;
  if (localStorage.getItem(sentKey)) return;
  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
  if (!createdAt || Date.now() - createdAt > 10 * 60 * 1000) {
    localStorage.setItem(sentKey, '1');
    return;
  }
  const email = user.email;
  if (!email) return;
  const firstName =
    (user.user_metadata?.first_name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ??
    null;
  const { error: weErr } = await sendWelcomeTransactionalEmail({
    templateName: 'welcome',
    recipientEmail: email,
    idempotencyKey: `welcome-${user.id}`,
    templateData: firstName ? { firstName } : {},
  });
  if (!weErr) localStorage.setItem(sentKey, '1');
  else holzenLog.auth('welcome email invoke failed', { message: weErr.message });
}

/** Runs welcome side effects after `SIGNED_IN` (fire-and-forget from provider). */
export function runSignedInSideEffects(user: User): void {
  void runWelcomeEmailOnSignedIn(user);
}
