/** Input for Home manual-open orchestration and create-or-reuse RPC shaping. */
export type OpenManualPauseFromHomeParams = {
  userId: string;
  silentMode: boolean;
  contextText: string;
  silentMessage: string;
  mood?: string | null;
  changePercent: number;
  trackedAssetId: string;
  severityBand: string;
  /** Used for fingerprint banding (legacy field name). */
  fearGreedLabel: string | null;
  onChainBand: string | null;
  /** Trigger-time F&G — stored on `context_snapshot` like cron pauses. */
  fearGreed: { value: number; label: string } | null;
  /** Trigger-time on-chain metrics (BTC only) — same shape as cron `on_chain`. */
  onChain: Record<string, unknown> | null;
};
