export type SignalSourceCatalogRow = { url: string | null };

/** Normalized host (lowercase, no `www.`) from a URL string; `null` when invalid. */
export function extractSignalSourceHost(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Whether the signal URL host matches a curated `signal_sources` row.
 * Returns `null` while catalog is loading or host is unknown.
 */
export function resolveSignalSourceTrustedBadge(
  host: string | null,
  catalog: readonly SignalSourceCatalogRow[],
  query: { pending: boolean; error: boolean },
): boolean | null {
  if (!host) return null;
  if (query.pending) return null;
  if (query.error) return false;
  if (catalog.length === 0) return false;
  const trustedHosts = new Set<string>();
  for (const row of catalog) {
    const h = extractSignalSourceHost(row.url);
    if (h) trustedHosts.add(h);
  }
  return trustedHosts.has(host);
}
