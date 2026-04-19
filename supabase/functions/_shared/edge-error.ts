// Standardized edge function error envelope.
//
// Every edge function should throw `EdgeError` for user-visible failures:
//
//   if (!user) throw new EdgeError('auth_required', 'Sign in required', 401);
//   if (quota < 1) throw new EdgeError('rate_limited', 'Daily limit reached', 429);
//
// Benefits:
//   - A single `code` field clients can branch on (not a fragile status-text match).
//   - `withRequestLogging` can short-circuit known codes — they become structured logs but do
//     NOT page to Sentry / Slack (they're expected).
//   - Users never see internal stack traces; the `message` field is curated UI copy.
//   - The wire shape matches `supabase.functions.invoke()`'s error handling.
//
// Response shape (JSON body):
//   { "error": { "code": "auth_required", "message": "Sign in required", "cid": "<uuid>" } }

const KNOWN_CODES = [
  "auth_required",
  "forbidden",
  "bad_input",
  "rate_limited",
  "not_found",
  "conflict",
  "dependency_unavailable",
  "internal",
] as const;

export type EdgeErrorCode = typeof KNOWN_CODES[number];

/** Codes that are *expected* in normal operation — noisy to alert on. */
export const EXPECTED_EDGE_ERROR_CODES: ReadonlySet<EdgeErrorCode> = new Set([
  "auth_required",
  "forbidden",
  "bad_input",
  "rate_limited",
  "not_found",
]);

export class EdgeError extends Error {
  readonly code: EdgeErrorCode;
  readonly status: number;
  /** Optional structured details that are safe to send back to the client. */
  readonly details?: Record<string, unknown>;

  constructor(
    code: EdgeErrorCode,
    message: string,
    status?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "EdgeError";
    this.code = code;
    this.status = status ?? defaultStatusFor(code);
    this.details = details;
  }

  /** True when this error is part of normal user flow, not a regression to alert on. */
  get isExpected(): boolean {
    return EXPECTED_EDGE_ERROR_CODES.has(this.code);
  }
}

function defaultStatusFor(code: EdgeErrorCode): number {
  switch (code) {
    case "auth_required":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "bad_input":
      return 400;
    case "rate_limited":
      return 429;
    case "conflict":
      return 409;
    case "dependency_unavailable":
      return 503;
    case "internal":
    default:
      return 500;
  }
}

/** Type guard. Useful because errors can cross Deno/V8 realms and lose their prototype. */
export function isEdgeError(err: unknown): err is EdgeError {
  if (err instanceof EdgeError) return true;
  if (!err || typeof err !== "object") return false;
  const cast = err as { name?: unknown; code?: unknown };
  return (
    cast.name === "EdgeError" &&
    typeof cast.code === "string" &&
    (KNOWN_CODES as readonly string[]).includes(cast.code)
  );
}

/** Serialise an EdgeError to a plain object safe for JSON.stringify. */
export function edgeErrorToJson(err: EdgeError, cid?: string) {
  return {
    error: {
      code: err.code,
      message: err.message,
      ...(cid ? { cid } : {}),
      ...(err.details ? { details: err.details } : {}),
    },
  };
}
