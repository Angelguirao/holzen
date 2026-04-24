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
  const pid = body.pauseInstanceId;
  const pausePrefix = typeof pid === "string" && pid.length >= 8 ? pid.slice(0, 8) : null;
  const regen = body.regenerateOnly;
  try {
    console.log(
      JSON.stringify({
        holzen_event: "orchestrate_invoke",
        invoke_source: invokeSource,
        auth_mode: authMode,
        pause_instance_prefix: pausePrefix,
        regenerate_only: typeof regen === "string" ? regen : null,
        ts: new Date().toISOString(),
      }),
    );
  } catch {
    /* non-fatal */
  }
}
