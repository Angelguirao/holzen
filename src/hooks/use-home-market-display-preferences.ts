import { useCallback, useEffect, useState } from 'react';
import { trackEvent } from '@/lib/posthog';

function readIsTrue(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

/**
 * Price visibility, BTC unit mode, and market chart expand state for the Home market widget.
 */
export function useHomeMarketDisplayPreferences() {
  const [priceHidden, setPriceHidden] = useState(() => readIsTrue('holzen_hide_price'));
  const [btcMode, setBtcMode] = useState(() => readIsTrue('holzen_btc_mode'));
  const [marketChartExpanded, setMarketChartExpanded] = useState(false);
  const marketChartExpandBlocked = btcMode || priceHidden;

  useEffect(() => {
    if (btcMode || priceHidden) {
      setMarketChartExpanded(false);
    }
  }, [btcMode, priceHidden]);

  const togglePriceHidden = useCallback(() => {
    setPriceHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('holzen_hide_price', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleBtcMode = useCallback(() => {
    setBtcMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('holzen_btc_mode', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleMarketChartExpanded = useCallback(() => {
    setMarketChartExpanded((prev) => {
      const next = !prev;
      trackEvent('home.market_chart_expand_toggled', { expanded: next });
      return next;
    });
  }, []);

  return {
    priceHidden,
    btcMode,
    marketChartExpanded,
    marketChartExpandBlocked,
    togglePriceHidden,
    toggleBtcMode,
    toggleMarketChartExpanded,
  };
}
