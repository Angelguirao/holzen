/** Shared BTC anniversary row shape (Look Back; legacy Zoom Out payloads). */
export interface BtcOnThisDayEntry {
  yearsAgo: number;
  price: number;
  date: string;
}

export interface BtcOnThisDayOverlay {
  onThisDay: BtcOnThisDayEntry[];
  currentPrice: number | null;
  partial?: boolean;
}
