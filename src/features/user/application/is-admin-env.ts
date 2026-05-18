/** Client-side admin allowlist from `VITE_ADMIN_USER_IDS` (comma-separated UUIDs). */
export function isAdminFromEnvList(userId: string): boolean {
  const ids = import.meta.env.VITE_ADMIN_USER_IDS as string | undefined;
  if (!ids) return false;
  return ids.split(',').some((s) => s.trim() === userId);
}
