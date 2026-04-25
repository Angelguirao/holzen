/**
 * Supabase Edge (and similar) expose `EdgeRuntime.waitUntil(promise)` on `globalThis`
 * for work that continues after the response is sent. Typed access avoids `(globalThis as any)`.
 */
export interface EdgeRuntimeShape {
  waitUntil(promise: Promise<unknown>): void;
}

export function getEdgeRuntime(): EdgeRuntimeShape | undefined {
  const g = globalThis as Record<string, unknown>;
  const rt = g["EdgeRuntime"];
  if (rt && typeof rt === "object" && rt !== null) {
    const wu = (rt as { waitUntil?: unknown }).waitUntil;
    if (typeof wu === "function") return rt as EdgeRuntimeShape;
  }
  return undefined;
}

/** Safe `.message` for catch blocks without `as any`. */
export function errorMessageFromUnknown(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return String(e);
}
