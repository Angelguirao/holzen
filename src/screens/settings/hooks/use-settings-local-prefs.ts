import { useCallback, useState } from 'react';
import { isHapticEnabled, setHapticEnabled as persistHapticEnabled } from '@/lib/haptics';

const UNIT_BASIS_MODE_STORAGE_KEY = 'holzen_btc_mode';

/** Device-local toggles (not persisted to profile). */
export function useSettingsLocalPrefs() {
  const [hapticEnabled, setHapticEnabledState] = useState(isHapticEnabled);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem('holzen_sound_enabled') !== 'false',
  );
  const [unitBasisMode, setUnitBasisMode] = useState(
    () => localStorage.getItem(UNIT_BASIS_MODE_STORAGE_KEY) === 'true',
  );

  const setHapticEnabled = useCallback((value: boolean) => {
    setHapticEnabledState(value);
    persistHapticEnabled(value);
  }, []);

  return {
    hapticEnabled,
    setHapticEnabled,
    soundEnabled,
    setSoundEnabled,
    unitBasisMode,
    setUnitBasisMode,
    /** @deprecated Use unitBasisMode */
    btcMode: unitBasisMode,
    /** @deprecated Use setUnitBasisMode */
    setBtcMode: setUnitBasisMode,
  };
}
