"use client";

import { useEffect, useState } from "react";
import { loadStealthPreference, setStealthMode } from "@/lib/audio";

export function StealthModeToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(loadStealthPreference());
  }, []);

  return (
    <button
      type="button"
      className="stealth-toggle"
      aria-pressed={on}
      title={on ? "Stealth Mode on (muted)" : "Stealth Mode off"}
      onClick={() => {
        const next = !on;
        setOn(next);
        setStealthMode(next);
      }}
    >
      {on ? "🔇 Muted" : "🔊 Sound"}
    </button>
  );
}
