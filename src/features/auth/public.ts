/** Public API for auth — export only what other features may import. */
import type { User } from '@supabase/supabase-js';

/** Shape exposed by `AuthProvider` / `useAuth` (React glue stays in `src/hooks/use-auth.tsx`). */
export interface AuthSessionState {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
