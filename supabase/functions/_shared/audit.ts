// Audit log helper for edge functions.
//
// Usage (see docs/ops/edge-logging-conventions.md § Audit log):
//
//   await logAudit(serviceClient, {
//     actor_id: user.id,
//     action: "account.deleted",
//     target_type: "user",
//     target_id: user.id,
//     before: { had_subscription: hadActiveSub },
//     after: null,
//     cid,
//     metadata: { fn: "delete-account" },
//   });
//
// Semantics:
//   - Fire-and-forget. Returns `Promise<void>`. Failures are logged but NOT re-thrown:
//     audit writes must never block the user-visible action (we'd rather have a missing
//     audit row than a failed deletion on the user's side).
//   - Requires a service-role Supabase client (RLS disallows authenticated INSERTs).
//   - `before` / `after` must be scrubbed of PII by the caller. This helper does not run a
//     content scrubber — the rule is "don't pass reflection text to begin with".

export interface AuditLogEntry {
  actor_id?: string | null;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  cid?: string | null;
  metadata?: Record<string, unknown> | null;
}

// Minimal structural type so callers can pass either a typed `SupabaseClient<Database>` or
// the loosely-typed service client created inline in many existing edge functions.
//
// Note: `insert(...)` returns a `PostgrestFilterBuilder` (PromiseLike, not a native Promise),
// so we type it as `PromiseLike` to stay compatible with both typed and untyped clients.
export interface AuditInsertResult {
  error: { message: string; code?: string } | null;
}
export interface AuditClient {
  from(table: string): { insert(values: Record<string, unknown>): PromiseLike<AuditInsertResult> };
}

export async function logAudit(svc: AuditClient, entry: AuditLogEntry): Promise<void> {
  try {
    const row: Record<string, unknown> = {
      action: entry.action,
    };
    if (entry.actor_id !== undefined) row.actor_id = entry.actor_id;
    if (entry.target_type !== undefined) row.target_type = entry.target_type;
    if (entry.target_id !== undefined) row.target_id = entry.target_id;
    if (entry.before !== undefined) row.before = entry.before;
    if (entry.after !== undefined) row.after = entry.after;
    if (entry.cid !== undefined) row.cid = entry.cid;
    if (entry.metadata !== undefined) row.metadata = entry.metadata;

    const result = (await svc.from("audit_log").insert(row)) as AuditInsertResult;
    const error = result?.error;
    if (error) {
      console.error("[audit] insert failed", { code: error.code, message: error.message });
    }
  } catch (err) {
    console.error("[audit] unexpected error", err);
  }
}
