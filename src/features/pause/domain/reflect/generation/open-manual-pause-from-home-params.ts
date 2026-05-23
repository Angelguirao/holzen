/** Input for Home manual-open orchestration and create-or-reuse RPC shaping. */
export type OpenManualPauseFromHomeParams = {
  userId: string;
  silentMode: boolean;
  contextText: string;
  silentMessage: string;
  mood?: string | null;
  changePercent: number;
  cumulativeChangePercent: number | null;
  trackedAssetId: string;
  severityBand: string;
  fearGreedLabel: string | null;
  onChainBand: string | null;
};
