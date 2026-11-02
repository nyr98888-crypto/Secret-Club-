"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_BACKDROP,
  readBackdropTheme,
  writeBackdropTheme,
  type BackdropTheme,
} from "@/lib/backdropTheme";

/**
 * Lightweight scrapbook UI state — currently rooms (backdrop mood).
 */
export function useScrapbookState() {
  const [backdropTheme, setBackdropThemeState] =
    useState<BackdropTheme>(DEFAULT_BACKDROP);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBackdropThemeState(readBackdropTheme());
    setHydrated(true);
  }, []);

  const setBackdropTheme = useCallback((next: BackdropTheme) => {
    setBackdropThemeState(next);
    writeBackdropTheme(next);
  }, []);

  return {
    backdropTheme,
    setBackdropTheme,
    hydrated,
  };
}
