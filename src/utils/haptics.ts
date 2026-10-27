/**
 * Tactile haptic feedback utility using the Navigator Vibration API.
 * Optimized for Android PWAs, TWA/APKs, and mobile browsers.
 * Safe for cross-origin iframes, SSR, desktop browsers, and devices without vibrator hardware.
 */
export type HapticFeedbackType =
  | 'light'      // subtle crisp tick for tabs / quick clicks
  | 'selection'  // clear selection tick for carousel swipe / palette switch
  | 'medium'     // distinct notch for temperature steppers (+/-) & rotary steps
  | 'heavy'      // deep tactile pulse for power toggle / major actions
  | 'success'    // double rhythmic confirmation (e.g. saved schedule / presets)
  | 'warning';   // alert vibration

/** Check whether navigator.vibrate is supported in this browser/device */
export const isHapticSupported = (): boolean => {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
};

export const triggerHaptic = (type: HapticFeedbackType = 'light'): void => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }

  try {
    // Note: Android ERM (eccentric rotating mass) and linear motors require ~35-50ms
    // to physically overcome inertia and spin up. Flagship Z/X-axis haptics also feel
    // substantially richer with tailored millisecond pulse packages.
    switch (type) {
      case 'light':
        navigator.vibrate(40);
        break;
      case 'selection':
        navigator.vibrate(55);
        break;
      case 'medium':
        navigator.vibrate(80);
        break;
      case 'heavy':
        navigator.vibrate(140);
        break;
      case 'success':
        navigator.vibrate([60, 50, 75]);
        break;
      case 'warning':
        navigator.vibrate([90, 60, 90]);
        break;
      default:
        navigator.vibrate(50);
        break;
    }
  } catch {
    // Gracefully handle if iframe lacks permission or device throws
  }
};

