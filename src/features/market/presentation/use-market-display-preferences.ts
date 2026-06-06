import { useCallback, useEffect, useState } from 'react';
import { readUnitBasisModeFromStorage, writeUnitBasisModeToStorage } from '@/features/market/domain/unit-basis-mode-storage';
import { trackHomeMarketChartExpandToggled } from './market-display-io';

function readIsTrue(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

/**
 * Price visibility, unit-basis display mode (1 BTC = 1 BTC), and market chart expand state for Home.
 */
export function useMarketDisplayPreferences() {
  const [priceHidden, setPriceHidden] = useState(() => readIsTrue('holzen_hide_price'));
  const [unitBasisMode, setUnitBasisMode] = useState(() => readUnitBasisModeFromStorage());
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
      writeUnitBasisModeToStorage(next);
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
