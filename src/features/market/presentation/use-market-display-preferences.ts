import { useCallback, useEffect, useState } from 'react';
import { trackHomeMarketChartExpandToggled } from './market-display-io';

function readIsTrue(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

/** Price visibility and market chart expand state for Home. */
export function useMarketDisplayPreferences() {
  const [priceHidden, setPriceHidden] = useState(() => readIsTrue('holzen_hide_price'));
  const [marketChartExpanded, setMarketChartExpanded] = useState(false);
  const marketChartExpandBlocked = priceHidden;

  useEffect(() => {
    if (priceHidden) {
      setMarketChartExpanded(false);
    }
  }, [priceHidden]);

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

  const toggleMarketChartExpanded = useCallback(() => {
    setMarketChartExpanded((prev) => {
      const next = !prev;
      trackHomeMarketChartExpandToggled(next);
      return next;
    });
  }, []);

  return {
    priceHidden,
    marketChartExpanded,
    marketChartExpandBlocked,
    togglePriceHidden,
    toggleMarketChartExpanded,
  };
}
