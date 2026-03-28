/**
 * Single source of truth for reflection **context string** suffixes after the BTC move line:
 * Fear & Greed, then on-chain metrics — same order and wording as manual pause (`use-holzen`).
 *
 * Imported by the Vite app via `@holzen-pause-context` and by Edge code via relative path.
 */

export interface PauseContextFearGreed {
  value: number;
  label: string;
}

export interface PauseContextOnChain {
  mempoolSize?: number;
  fastestFee?: number;
  medianFee?: number;
  hashrate?: string;
  blockHeight?: number;
}

export function appendFearGreedToPauseContext(
  ctx: string,
  fg: PauseContextFearGreed | null | undefined,
): string {
  if (!fg) return ctx;
  return `${ctx} Market sentiment: ${fg.label} (${fg.value}/100).`;
}

export function appendOnChainToPauseContext(
  ctx: string,
  oc: PauseContextOnChain | null | undefined,
): string {
  if (!oc) return ctx;
  let out = ctx;
  // Truthy checks match `use-holzen` / legacy `generateMessage` (skip 0 mempool / fee edge cases).
  if (oc.mempoolSize) {
    out += ` Mempool: ${oc.mempoolSize.toLocaleString()} unconfirmed txs.`;
  }
  if (oc.fastestFee) {
    out += ` Fees: ${oc.fastestFee} sat/vB (fastest), ${oc.medianFee ?? "?"} sat/vB (medium).`;
  }
  if (oc.hashrate) out += ` Hashrate: ${oc.hashrate}.`;
  if (oc.blockHeight) out += ` Block height: ${oc.blockHeight.toLocaleString()}.`;
  return out;
}

/** Fear & Greed first, then on-chain (matches `use-holzen` `generateMessage`). */
export function enrichPauseContextWithMarketData(
  baseCtx: string,
  fearGreed: PauseContextFearGreed | null | undefined,
  onChain: PauseContextOnChain | null | undefined,
): string {
  return appendOnChainToPauseContext(appendFearGreedToPauseContext(baseCtx, fearGreed), onChain);
}
