"use client";

import { useDeviceLayout } from "./useDeviceLayout";

/**
 * True in portrait craft modes (phone + tablet clipboard).
 * False for landscape open-book binder.
 * @deprecated Prefer useDeviceLayout() for mode-specific UI.
 */
export function useIsCompactLayout(_breakpointPx?: number) {
  const { isPortrait } = useDeviceLayout();
  return isPortrait;
}
