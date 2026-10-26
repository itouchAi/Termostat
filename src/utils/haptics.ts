/**
 * Tactile haptic feedback utility using the Navigator Vibration API.
 * Safe for cross-origin iframes, SSR, desktop browsers, and devices without vibrator hardware.
 */
export type HapticFeedbackType =
  | 'light'      // subtle tick for clicks / tabs
  | 'selection'  // crisp selection tick for carousel swipe / palette
  | 'medium'     // distinct notch for steppers (+/-) & mode changes
  | 'heavy'      // deep tactile pulse for power toggle
  | 'success'    // double rhythmic confirmation (e.g. saved schedule)
  | 'warning';   // alert vibration

export const triggerHaptic = (type: HapticFeedbackType = 'light'): void => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(24);
        break;
      case 'selection':
        navigator.vibrate(32);
        break;
      case 'medium':
        navigator.vibrate(45);
        break;
      case 'heavy':
        navigator.vibrate(70);
        break;
      case 'success':
        navigator.vibrate([28, 45, 35]);
        break;
      case 'warning':
        navigator.vibrate([50, 70, 50]);
        break;
      default:
        navigator.vibrate(28);
        break;
    }
  } catch {
    // Gracefully handle if iframe lacks permission or device throws
  }
};
