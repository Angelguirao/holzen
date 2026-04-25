/**
 * Serialize unknown rejects / Postgres errors for structured edge logs (no throwing).
 */

export function unknownErrorForLog(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { error_message: err.message.slice(0, 2000) };
  }
  if (typeof err === "object" && err !== null) {
    const o = err as Record<string, unknown>;
    const msg = typeof o.message === "string" ? o.message : undefined;
    const code = typeof o.code === "string" ? o.code : undefined;
    if (msg || code) {
      return {
        ...(code ? { error_code: code } : {}),
        ...(msg ? { error_message: msg.slice(0, 2000) } : {}),
      };
    }
    try {
      return { error_message: JSON.stringify(err).slice(0, 1000) };
    } catch {
      return { error_message: "[unserializable]" };
    }
  }
  return { error_message: String(err).slice(0, 2000) };
}

/** `web-push` errors often expose HTTP status for dead subscriptions (410/404). */
export function webPushStatusCode(err: unknown): number | undefined {
  if (err && typeof err === "object" && "statusCode" in err) {
    const sc = (err as { statusCode?: unknown }).statusCode;
    return typeof sc === "number" ? sc : undefined;
  }
  return undefined;
}
