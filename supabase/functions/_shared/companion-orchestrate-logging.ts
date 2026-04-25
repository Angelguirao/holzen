import type { createLogger } from "./observe.ts";

type RequestLog = ReturnType<typeof createLogger>;

/** Client/cron overlap metrics — grep: `orchestrate_invoke` or `holzen_event":"orchestrate_invoke"` */
export function logOrchestrateInvoke(
  log: RequestLog,
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
  let regenerateOnly: string | null = null;
  if (typeof regen === "string") regenerateOnly = regen;
  else if (regen === true) regenerateOnly = "true";
  else if (regen === false) regenerateOnly = "false";

  try {
    log("orchestrate_invoke", {
      holzen_event: "orchestrate_invoke",
      invoke_source: invokeSource,
      auth_mode: authMode,
      pause_instance_prefix: pausePrefix,
      regenerate_only: regenerateOnly,
    });
  } catch {
    /* non-fatal */
  }
}
