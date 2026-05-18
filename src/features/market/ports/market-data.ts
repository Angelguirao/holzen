/** Port for market price / context feeds — implement when `btc` and edge queries move off `src/lib`. */
export interface MarketDataPort {
  /** Placeholder until market infrastructure slice lands. */
  readonly _brand?: 'MarketDataPort';
}
