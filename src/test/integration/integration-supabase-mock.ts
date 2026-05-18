/** Shared Supabase chain mock for integration harnesses. */
export function createIntegrationSupabaseMock() {
  const chain = () => {
    const c: Record<string, unknown> = {
      select: () => c,
      eq: () => c,
      gte: () => c,
      order: () => c,
      limit: () => Promise.resolve({ data: [], error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
    };
    return c;
  };

  return {
    from: () => chain(),
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
