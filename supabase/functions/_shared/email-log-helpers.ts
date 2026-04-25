/**
 * Safe fields for edge structured logs (stdout + BetterStack).
 * Full addresses must not appear in `extra` — use redacted / host-only forms.
 */

/** e.g. `a***@example.com` */
export function redactEmailForLog(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "[invalid]";
  const local = email.slice(0, at);
  const host = email.slice(at + 1);
  if (!host) return "[invalid]";
  const first = local[0] ?? "?";
  return `${first}***@${host.toLowerCase()}`;
}

export function recipientHostFromEmail(email: string): string | null {
  const at = email.indexOf("@");
  if (at <= 0 || at >= email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}
