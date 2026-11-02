"use client";

import type { CSSProperties } from "react";
import type { CircleMode } from "@/lib/types";

const PASTEL = [
  "#fda4af",
  "#f9a8d4",
  "#c4b5fd",
  "#a5b4fc",
  "#7dd3fc",
  "#6ee7b7",
  "#fde68a",
  "#fdba74",
];

const BURST_EMOJI = ["✨", "⭐", "💖", "🌟", "💕", "🌸", "💫", "💗"];

type BurstStyle = CSSProperties & {
  "--mx"?: string;
  "--my"?: string;
  "--spin"?: string;
};

function MagicalBurst({ label }: { label: string }) {
  return (
    <div className="payoff payoff-magic" aria-hidden>
      <div className="payoff-magic-wash" />

      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i / 36) * Math.PI * 2;
        const dist = 38 + (i % 5) * 12;
        const style: BurstStyle = {
          background: PASTEL[i % PASTEL.length],
          animationDelay: `${(i % 9) * 0.04}s`,
          "--mx": `${Math.cos(angle) * dist}vw`,
          "--my": `${Math.sin(angle) * dist}vh`,
          "--spin": `${220 + (i % 7) * 80}deg`,
        };
        return <span key={`c-${i}`} className="magic-confetti" style={style} />;
      })}

      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2 + 0.2;
        const dist = 22 + (i % 4) * 10;
        const style: BurstStyle = {
          animationDelay: `${(i % 8) * 0.05}s`,
          "--mx": `${Math.cos(angle) * dist}vw`,
          "--my": `${Math.sin(angle) * dist}vh`,
          fontSize: `${1.1 + (i % 3) * 0.35}rem`,
        };
        return (
          <span key={`e-${i}`} className="magic-spark" style={style}>
            {BURST_EMOJI[i % BURST_EMOJI.length]}
          </span>
        );
      })}

      <div className="magic-starburst" />
      <p className="payoff-label payoff-label-magic">{label}</p>
    </div>
  );
}

export function UnlockPayoff({
  mode,
  active,
}: {
  mode: CircleMode;
  active: boolean;
}) {
  if (!active) return null;

  if (mode === "squad") {
    return <MagicalBurst label="✨ SQUAD UNLOCKED! ✨" />;
  }

  return <MagicalBurst label="💖 BESTIE VAULT OPEN 💖" />;
}
