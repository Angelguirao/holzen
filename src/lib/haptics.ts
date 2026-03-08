/**
 * Trigger haptic feedback on supported devices.
 * Falls back silently on desktop / unsupported browsers.
 */
export function hapticFeedback(
  type: 'light' | 'medium' | 'success' | 'warning' = 'light'
) {
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
