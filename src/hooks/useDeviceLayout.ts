"use client";

import { useEffect, useState } from "react";

export type ViewportMode =
  | "mobile-portrait"
  | "tablet-portrait"
  | "landscape-book";

export type DeviceLayout = {
  mode: ViewportMode;
  width: number;
  height: number;
  /** True for phone + tablet portrait craft clipboard */
  isPortrait: boolean;
  /** Deluxe dual-page binder */
  isLandscapeBook: boolean;
  /** Narrow phone chrome (< 768) */
  isPhoneChrome: boolean;
  /** Hydrated after first measure (avoids wrong first paint) */
  ready: boolean;
};

/**
 * Universal Viewport Engine
 * - landscape-book: width ≥ 900 AND aspect ≥ 1.15 (open binder)
 * - mobile-portrait: width < 768 (pocket clipboard)
 * - tablet-portrait: everything else (tall tablets)
 */
export function resolveViewportMode(
  width: number,
  height: number,
): ViewportMode {
  const ratio = width / Math.max(height, 1);
  if (width >= 900 && ratio >= 1.15) return "landscape-book";
  if (width < 768) return "mobile-portrait";
  return "tablet-portrait";
}

const DEFAULT: DeviceLayout = {
  mode: "mobile-portrait",
  width: 0,
  height: 0,
  isPortrait: true,
  isLandscapeBook: false,
  isPhoneChrome: true,
  ready: false,
};

export function useDeviceLayout(): DeviceLayout {
  const [layout, setLayout] = useState<DeviceLayout>(DEFAULT);

  useEffect(() => {
    const apply = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mode = resolveViewportMode(width, height);
      setLayout({
        mode,
        width,
        height,
        isPortrait: mode !== "landscape-book",
        isLandscapeBook: mode === "landscape-book",
        isPhoneChrome: width < 768,
        ready: true,
      });
    };

    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    const mq = window.matchMedia("(orientation: landscape)");
    mq.addEventListener("change", apply);

    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      mq.removeEventListener("change", apply);
    };
  }, []);

  return layout;
}
