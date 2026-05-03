/** CoinGecko ids allowed in profiles.tracked_asset_id — keep in sync with update_profile_safe + src/lib/tracked-assets.ts */

const ALLOWED = new Set(["bitcoin", "ethereum", "solana", "monero"]);

export type TrackedAssetId = "bitcoin" | "ethereum" | "solana" | "monero";

export function normalizeTrackedAssetId(raw: string | null | undefined): TrackedAssetId {
  const s = (raw ?? "bitcoin").trim().toLowerCase();
  return ALLOWED.has(s) ? s as TrackedAssetId : "bitcoin";
}

export function trackedAssetSymbol(id: string): string {
  switch (normalizeTrackedAssetId(id)) {
    case "bitcoin":
      return "BTC";
    case "ethereum":
      return "ETH";
    case "solana":
      return "SOL";
    case "monero":
      return "XMR";
    default:
      return "BTC";
  }
}
