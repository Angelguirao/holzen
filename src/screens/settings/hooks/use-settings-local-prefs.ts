import { useCallback, useState } from 'react';
import { isHapticEnabled, setHapticEnabled as persistHapticEnabled } from '@/lib/haptics';

/** Device-local toggles (not persisted to profile). */
export function useSettingsLocalPrefs() {
  const [hapticEnabled, setHapticEnabledState] = useState(isHapticEnabled);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem('holzen_sound_enabled') !== 'false',
  );
  const [btcMode, setBtcMode] = useState(() => localStorage.getItem('holzen_btc_mode') === 'true');

  const setHapticEnabled = useCallback((value: boolean) => {
    setHapticEnabledState(value);
    persistHapticEnabled(value);
  }, []);

  return {
    hapticEnabled,
    setHapticEnabled,
    soundEnabled,
    setSoundEnabled,
    btcMode,
    setBtcMode,
  };
}
