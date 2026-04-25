type EdgeInvokePayload = {
  error?: string | {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
  code?: string;
  details?: Record<string, unknown>;
};

export type ParsedEdgeFunctionError = {
  message: string | null;
  code: string | null;
  details: Record<string, unknown> | null;
};

async function readInvokePayloadFromError(error: unknown): Promise<EdgeInvokePayload | undefined> {
  if (!error || typeof error !== "object") return undefined;
  const ctx = (error as { context?: unknown }).context;
  if (!ctx || typeof ctx !== "object") return undefined;
  const json = (ctx as { json?: unknown }).json;
  if (typeof json !== "function") return undefined;
  const raw = await (json as () => Promise<unknown>)();
  if (!raw || typeof raw !== "object") return undefined;
  return raw as EdgeInvokePayload;
}

export async function parseEdgeFunctionError(error: unknown): Promise<ParsedEdgeFunctionError> {
  try {
    const payload = await readInvokePayloadFromError(error);
    if (!payload) return { message: null, code: null, details: null };
    if (typeof payload.error === "string") {
      return {
        message: payload.error,
        code: typeof payload.code === "string" ? payload.code : null,
        details: payload.details ?? null,
      };
    }
    if (payload.error && typeof payload.error === "object") {
      return {
        message: typeof payload.error.message === "string" ? payload.error.message : null,
        code: typeof payload.error.code === "string" ? payload.error.code : null,
        details: payload.error.details ?? null,
      };
    }
  } catch {
    // ignore parse failures and return fallback
  }
  return { message: null, code: null, details: null };
}

const ALLOWANCE_CODES = new Set([
  "companions_quota_exceeded",
  "companions_upgrade_required",
  "ai_action_quota_exceeded",
  "ai_action_upgrade_required",
  "insights_quota_exceeded",
  "insights_upgrade_required",
  "wallpaper_quota_exceeded",
  "wallpaper_upgrade_required",
]);

/**
 * Convert edge function failures into user-facing copy:
 * - keep allowance/upgrade messages specific,
 * - collapse operational guardrails (budget/circuit breaker/rate-limits/provider errors)
 *   into a single friendly retry-later message.
 */
export function toUserFacingAiErrorMessage(
  parsed: ParsedEdgeFunctionError,
  fallback: string,
): string {
  if (parsed.code && ALLOWANCE_CODES.has(parsed.code)) {
    return parsed.message ?? fallback;
  }

  const lower = (parsed.message ?? "").toLowerCase();
  if (
    lower.includes("rate limited") ||
    lower.includes("budget exceeded") ||
    lower.includes("cap exceeded") ||
    lower.includes("temporarily unavailable") ||
    lower.includes("provider") ||
    lower.includes("degraded") ||
    lower.includes("feature") ||
    lower.includes("panic mode")
  ) {
    return "This AI feature is temporarily unavailable. Please try again in a minute.";
  }

  return parsed.message ?? fallback;
}
