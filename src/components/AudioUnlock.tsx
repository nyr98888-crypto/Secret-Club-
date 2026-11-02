"use client";

import { useEffect } from "react";
import { ensureAudio, loadStealthPreference } from "@/lib/audio";

/** Resume AudioContext on first pointer/key interaction. */
export function AudioUnlock() {
  useEffect(() => {
    loadStealthPreference();
    const arm = () => {
      void ensureAudio();
    };
    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
  }, []);
  return null;
}
