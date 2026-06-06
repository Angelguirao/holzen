/** Shipped tracked assets — keep in sync with update_profile_safe + src/features/market/domain/tracked-assets.ts */

const ALLOWED = new Set(["bitcoin"]);

export type TrackedAssetId = "bitcoin";

export function normalizeTrackedAssetId(raw: string | null | undefined): TrackedAssetId {
  const s = (raw ?? "bitcoin").trim().toLowerCase();
  return ALLOWED.has(s) ? (s as TrackedAssetId) : "bitcoin";
}

export function trackedAssetSymbol(id: string): string {
  return normalizeTrackedAssetId(id) === "bitcoin" ? "BTC" : "BTC";
}

export function isBitcoinTrackedAsset(id: string | null | undefined): boolean {
  return normalizeTrackedAssetId(id) === "bitcoin";
}
