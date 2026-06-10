const INTEGRATION_USER_ID = '00000000-0000-4000-8000-000000000001';

/** Minimal `profiles` row so Holzen/profile hooks settle without real Supabase. */
const INTEGRATION_PROFILE_ROW = {
  user_id: INTEGRATION_USER_ID,
  threshold: 5,
  threshold_down: 5,
  last_context: null,
  email_notifications: true,
  has_onboarded: true,
  companion_haiku: true,
  companion_grounding: true,
  companion_signal: true,
  companion_zoom_out: true,
  companion_history: true,
  reflection_tone: 'stoic',
  cooldown_hours: 6,
  last_trigger_at: null,
  silent_mode: false,
  custom_prompt: null,
  reflection_style: 'standard',
  quiet_hours_start: null,
  quiet_hours_end: null,
  first_name: null,
  motivations: [],
  mantra: null,
  display_currency: 'USD',
  tracked_asset_id: 'bitcoin',
  language: 'en',
  grounding_activities: [],
  created_at: new Date().toISOString(),
  snoozed_until: null,
  is_admin: false,
};

function chainForTable(table: string) {
  const c: Record<string, unknown> = {
    select: () => chainForTable(table),
    eq: () => chainForTable(table),
    in: () => chainForTable(table),
    gte: () => chainForTable(table),
    order: () => chainForTable(table),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => chainForTable(table),
    delete: () => chainForTable(table),
    limit: () => Promise.resolve({ data: [], error: null }),
    maybeSingle: () =>
      Promise.resolve({
        data: table === 'profiles' ? INTEGRATION_PROFILE_ROW : null,
        error: null,
      }),
    single: () =>
      Promise.resolve({
        data: table === 'profiles' ? INTEGRATION_PROFILE_ROW : null,
        error: null,
      }),
  };
  return c;
}

/** Shared Supabase chain mock for integration harnesses. */
export function createIntegrationSupabaseMock() {
  return {
    from: (table: string) => chainForTable(table),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    functions: { invoke: async () => ({ data: {}, error: null }) },
  };
}
