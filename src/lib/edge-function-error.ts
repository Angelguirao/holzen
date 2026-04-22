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

export async function parseEdgeFunctionError(error: unknown): Promise<ParsedEdgeFunctionError> {
  try {
    const payload = await (error as any)?.context?.json?.() as EdgeInvokePayload | undefined;
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
