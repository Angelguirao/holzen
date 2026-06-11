import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function supabaseEnv(): { url: string; key: string } | null {
  const url = import.meta.env.PUBLIC_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key =
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

/** Build-time blog fetch — returns null when Supabase env is missing (local Astro-only dev). */
export function getSupabaseClient(): SupabaseClient | null {
  const env = supabaseEnv();
  if (!env) return null;
  return createClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
