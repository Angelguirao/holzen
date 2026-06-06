import { useCallback, useState } from 'react';
import { readUnitBasisModeFromStorage } from '@/features/market/domain/unit-basis-mode-storage';
import { isHapticEnabled, setHapticEnabled as persistHapticEnabled } from '@/lib/haptics';

/** Device-local toggles (not persisted to profile). */
export function useSettingsLocalPrefs() {
  const [hapticEnabled, setHapticEnabledState] = useState(isHapticEnabled);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem('holzen_sound_enabled') !== 'false',
  );
  const [unitBasisMode, setUnitBasisMode] = useState(() => readUnitBasisModeFromStorage());

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
