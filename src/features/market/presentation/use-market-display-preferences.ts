import { useCallback, useEffect, useState } from 'react';
import { trackHomeMarketChartExpandToggled } from './market-display-io';

function readIsTrue(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

const UNIT_BASIS_MODE_STORAGE_KEY = 'holzen_btc_mode';

/**
 * Price visibility, unit-basis display mode (1 BTC = 1 BTC), and market chart expand state for Home.
 */
export function useMarketDisplayPreferences() {
  const [priceHidden, setPriceHidden] = useState(() => readIsTrue('holzen_hide_price'));
  const [unitBasisMode, setUnitBasisMode] = useState(() => readIsTrue(UNIT_BASIS_MODE_STORAGE_KEY));
  const [marketChartExpanded, setMarketChartExpanded] = useState(false);
  const marketChartExpandBlocked = unitBasisMode || priceHidden;

  useEffect(() => {
    if (unitBasisMode || priceHidden) {
      setMarketChartExpanded(false);
    }
  }, [unitBasisMode, priceHidden]);

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

  const toggleUnitBasisMode = useCallback(() => {
    setUnitBasisMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(UNIT_BASIS_MODE_STORAGE_KEY, String(next));
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
    unitBasisMode,
    marketChartExpanded,
    marketChartExpandBlocked,
    togglePriceHidden,
    toggleUnitBasisMode,
    toggleMarketChartExpanded,
    /** @deprecated Use unitBasisMode */
    btcMode: unitBasisMode,
    /** @deprecated Use toggleUnitBasisMode */
    toggleBtcMode: toggleUnitBasisMode,
  };
}
