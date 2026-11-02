export function vibrateTap() {
  try {
    navigator.vibrate?.([20]);
  } catch {
    /* unsupported */
  }
}

export function vibrateUnlock() {
  try {
    navigator.vibrate?.([40, 60, 100]);
  } catch {
    /* unsupported */
  }
}
