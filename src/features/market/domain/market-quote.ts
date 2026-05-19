import type { TrackedAssetId } from './tracked-assets';

export interface FearGreedData {
  value: number;
  label: string;
}

export interface OnChainData {
  mempoolSize?: number;
  fastestFee?: number;
  medianFee?: number;
  hashrate?: string;
  blockHeight?: number;
}

/** Market quote for a single tracked asset in the user's display currency. */
export interface BtcPriceData {
  /** CoinGecko coin id (e.g. bitcoin, ethereum). */
  coinId: TrackedAssetId;
  currentPrice: number;
  price24hAgo: number;
  changePercent: number;
  direction: 'up' | 'down';
  cumulativeChangePercent?: number;
  cumulativeDirection?: 'up' | 'down';
  fearGreed?: FearGreedData;
  onChain?: OnChainData;
  currency: string;
  /** True when data comes from localStorage cache due to API failure */
  _stale?: boolean;
}

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'KRW', symbol: '₩', label: 'South Korean Won' },
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]['code'];
