"use client";

import type { CircleMode } from "@/lib/types";

export function UnlockPayoff({
  mode,
  active,
}: {
  mode: CircleMode;
  active: boolean;
}) {
  if (!active) return null;

  if (mode === "squad") {
    return (
      <div className="payoff payoff-squad" aria-hidden>
        <div className="radar" />
        <div className="glitch-flare" />
        <p className="payoff-label">SQUAD ACCESS GRANTED</p>
      </div>
    );
  }

  return (
    <div className="payoff payoff-bestie" aria-hidden>
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${(i * 17) % 100}%`,
            animationDelay: `${(i % 8) * 0.05}s`,
            background: ["#ff6b9d", "#ffe66d", "#7bed9f", "#70a1ff", "#ffa502"][
              i % 5
            ],
          }}
        />
      ))}
      <p className="payoff-label">BESTIE VAULT OPEN</p>
    </div>
  );
}
