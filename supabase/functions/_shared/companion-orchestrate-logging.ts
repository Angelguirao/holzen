/** Client/cron overlap metrics — grep: orchestrate_invoke */
export function logOrchestrateInvoke(
  body: Record<string, unknown>,
  authMode: "service_role" | "user_jwt",
) {
  const raw = body.holzenInvokeSource;
  const invokeSource =
    typeof raw === "string" && /^[a-z0-9_.:-]+$/i.test(raw) && raw.length <= 48
      ? raw
      : "unknown";
  const rid = body.reflectionId;
  const reflectionPrefix = typeof rid === "string" && rid.length >= 8 ? rid.slice(0, 8) : null;
  const regen = body.regenerateOnly;
  try {
    console.log(
      JSON.stringify({
        holzen_event: "orchestrate_invoke",
        invoke_source: invokeSource,
        auth_mode: authMode,
        reflection_prefix: reflectionPrefix,
        regenerate_only: typeof regen === "string" ? regen : null,
        ts: new Date().toISOString(),
      }),
    );
  } catch {
    /* non-fatal */
  }
}
