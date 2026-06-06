/** Shared tracked-asset anniversary row shape (Look Back; legacy Zoom Out payloads). */
export interface MarketOnThisDayEntry {
  yearsAgo: number;
  price: number;
  date: string;
}

export interface MarketOnThisDayOverlay {
  onThisDay: MarketOnThisDayEntry[];
  currentPrice: number | null;
  partial?: boolean;
}
