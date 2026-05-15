// Browser Supabase client for this app. `types.ts` is regenerated from the DB schema;
// this wrapper is maintained in-repo — change auth/storage options here when needed.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getCid } from '@/lib/cid';
import { getHolzenOutgoingTraceHeaders } from '@/lib/trace-propagation';

declare const __APP_VERSION__: string;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Transparent `x-cid` injection for every edge function call.
//
// Existing call sites (`supabase.functions.invoke(...)`) keep working unchanged and now get
// a correlation id automatically. New code should prefer `invokeEdge()` from
// `src/lib/invoke-edge.ts` — it is a thin wrapper that also yields typed results — but both
// paths end up here.
//
// We patch the method rather than wrap the whole client so: (1) chained calls
// (`supabase.from(...).select(...)`) are untouched, and (2) the type signature stays stable.
type InvokeFn = typeof supabase.functions.invoke;
const originalInvoke: InvokeFn = supabase.functions.invoke.bind(supabase.functions);

supabase.functions.invoke = ((functionName: string, options?: Parameters<InvokeFn>[1]) => {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> | undefined),
  };
  // Don't clobber a caller-supplied cid (useful for tests / replay scripts).
  if (!headers["x-cid"] && !headers["X-Cid"]) {
    try {
      headers["x-cid"] = getCid();
    } catch {
      /* getCid is defensive — this is belt-and-suspenders */
    }
  }
  // Frontend release, mirrored on every edge call so Sentry edge events can tag
  // `frontend_release` regardless of whether the caller used `invokeEdge()` or
  // `supabase.functions.invoke()` directly. Caller-supplied header still wins.
  if (!headers["x-app-version"] && !headers["X-App-Version"]) {
    try {
      headers["x-app-version"] = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev";
    } catch {
      /* define-guarded — shouldn't throw, but stay defensive */
    }
  }
  const trace = getHolzenOutgoingTraceHeaders();
  const headerKeysLower = new Set(Object.keys(headers).map((k) => k.toLowerCase()));
  for (const [k, v] of Object.entries(trace)) {
    if (headerKeysLower.has(k.toLowerCase())) continue;
    headers[k] = v;
    headerKeysLower.add(k.toLowerCase());
  }
  return originalInvoke(functionName, { ...options, headers });
}) as InvokeFn;