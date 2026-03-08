const HAPTIC_KEY = 'holzen_haptic_enabled';

/**
 * Check if haptic feedback is enabled (defaults to true).
 */
export function isHapticEnabled(): boolean {
  try {
    const val = localStorage.getItem(HAPTIC_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Enable or disable haptic feedback globally.
 */
export function setHapticEnabled(enabled: boolean) {
  try {
    localStorage.setItem(HAPTIC_KEY, String(enabled));
  } catch {
    // storage unavailable
  }
}

/**
 * Trigger haptic feedback on supported devices.
 * Falls back silently on desktop / unsupported browsers.
 * Respects the global haptic enabled setting.
 */
export function hapticFeedback(
  type: 'light' | 'medium' | 'success' | 'warning' = 'light'
) {
  if (!isHapticEnabled()) return;
  if (!('vibrate' in navigator)) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'success':
        navigator.vibrate([15, 50, 15]);
        break;
      case 'warning':
        navigator.vibrate([30, 30, 30]);
        break;
    }
  } catch {
    // Silently fail — some browsers block vibrate
  }
}
