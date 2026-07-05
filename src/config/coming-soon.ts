/** Build-time flag: production "closed" shell instead of the full app (see docs/ops/vercel-frontend-setup.md §5.1). */
export function isComingSoonMode(): boolean {
  const raw = import.meta.env.VITE_COMING_SOON;
  if (typeof raw !== "string") return false;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}
