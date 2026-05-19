/** Canonical production web origin (custom domain). Lovable preview hosts stay separate. */
const configuredOrigin = (import.meta.env.VITE_SITE_ORIGIN as string | undefined)?.trim();

export const SITE_ORIGIN =
  configuredOrigin && configuredOrigin.length > 0
    ? configuredOrigin.replace(/\/$/, "")
    : "https://holzen.app";

/** Hostname without scheme — share copy, plain-text links. */
export const SITE_HOST = (() => {
  try {
    return new URL(SITE_ORIGIN).hostname;
  } catch {
    return "holzen.app";
  }
})();
