"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { STARTER_GLYPHS } from "@/lib/passcode";
import { PASSCODE_LENGTH, passcodesMatch } from "@/lib/localClub";
import { vibrateTap, vibrateUnlock } from "@/lib/haptics";
import { ensureAudio, playChime, playUnlockSound } from "@/lib/audio";

const GEM_GRID = STARTER_GLYPHS.slice(0, 12);

type Phase = "set" | "confirm";

type ToyLockboxProps = {
  onLocked: (passcode: [string, string, string]) => void;
  onBack?: () => void;
};

type BurstBit = { id: number; emoji: string; dx: string; dy: string; delay: string };

export function ToyLockbox({ onLocked, onBack }: ToyLockboxProps) {
  const [phase, setPhase] = useState<Phase>("set");
  const [slots, setSlots] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [popIndex, setPopIndex] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const [burst, setBurst] = useState<BurstBit[]>([]);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (popIndex == null) return;
    const t = window.setTimeout(() => setPopIndex(null), 360);
    return () => clearTimeout(t);
  }, [popIndex]);

  function fillSocket(emoji: string) {
    if (opening || slots.length >= PASSCODE_LENGTH) return;
    void ensureAudio();
    vibrateTap();
    playChime();
    const next = [...slots, emoji];
    setSlots(next);
    setPopIndex(next.length - 1);

    if (next.length < PASSCODE_LENGTH) return;

    if (phase === "set") {
      window.setTimeout(() => {
        setSaved(next);
        setSlots([]);
        setPhase("confirm");
      }, 420);
      return;
    }

    if (!passcodesMatch(next, saved)) {
      setShake(true);
      window.setTimeout(() => {
        setShake(false);
        setSlots([]);
        setSaved([]);
        setPhase("set");
      }, 500);
      return;
    }

    // Confirmed — particle burst + open
    setOpening(true);
    vibrateUnlock();
    void ensureAudio().then(() => playUnlockSound());
    const bits: BurstBit[] = Array.from({ length: 18 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 18;
      const dist = 120 + Math.random() * 140;
      return {
        id: i,
        emoji: GEM_GRID[i % GEM_GRID.length],
        dx: `${Math.cos(angle) * dist}px`,
        dy: `${Math.sin(angle) * dist - 40}px`,
        delay: `${i * 18}ms`,
      };
    });
    setBurst(bits);
    window.setTimeout(() => {
      onLocked(next as [string, string, string]);
    }, 950);
  }

  function clearLast() {
    if (opening) return;
    setSlots((s) => s.slice(0, -1));
  }

  return (
    <div className="relative mx-auto w-full max-w-md px-4">
      {burst.length > 0 ? (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center overflow-visible">
          {burst.map((b) => (
            <span
              key={b.id}
              className="absolute text-2xl animate-burst-fly"
              style={
                {
                  "--dx": b.dx,
                  "--dy": b.dy,
                  animationDelay: b.delay,
                } as CSSProperties
              }
            >
              {b.emoji}
            </span>
          ))}
        </div>
      ) : null}

      <div
        className={`rounded-[2rem] border-4 border-white bg-gradient-to-b from-[#fff7fb] to-[#ffe0f2]
          p-5 shadow-[0_12px_0_rgba(244,114,182,0.35)] sm:p-6
          ${shake ? "animate-[shake_0.35s_linear]" : ""}
          ${opening ? "scale-105 opacity-90 transition-all duration-500" : ""}`}
      >
        <p className="mb-1 text-center text-sm font-semibold text-pink-500">
          {phase === "set" ? "Pick your secret jewels" : "Do it once more to lock it!"}
        </p>
        <h2 className="mb-5 text-center text-2xl font-bold text-[#5b2a4a] sm:text-3xl">
          {phase === "set" ? "3-Key Lockbox" : "Confirm your keys"}
        </h2>

        {/* Jewel sockets */}
        <div className="mb-6 flex justify-center gap-3 sm:gap-4">
          {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => {
            const filled = slots[i];
            const popping = popIndex === i;
            return (
              <div
                key={i}
                className="relative grid h-16 w-16 place-items-center rounded-full border-4 border-white
                  bg-gradient-to-b from-[#ffd6ea] to-[#f9a8d4]
                  shadow-[inset_0_4px_8px_rgba(255,255,255,0.65),0_6px_0_rgba(219,39,119,0.35)]
                  sm:h-[4.5rem] sm:w-[4.5rem]"
                aria-label={filled ? `Socket ${i + 1}: ${filled}` : `Empty socket ${i + 1}`}
              >
                <span
                  className={`text-3xl sm:text-4xl ${popping ? "animate-gem-pop" : ""}`}
                >
                  {filled || ""}
                </span>
                {!filled ? (
                  <span className="absolute inset-3 rounded-full border-2 border-dashed border-white/70" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* 3×4 chunky gem grid */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {GEM_GRID.map((emoji) => (
            <button
              key={emoji}
              type="button"
              disabled={opening || slots.length >= PASSCODE_LENGTH}
              onClick={() => fillSocket(emoji)}
              className="toy-btn aspect-square bg-gradient-to-b from-white to-[#ffe4f1] text-3xl sm:text-4xl
                disabled:hover:scale-100"
              aria-label={`Pick ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="toy-btn bg-white px-5 py-2.5 text-sm text-[#5b2a4a]"
            onClick={clearLast}
            disabled={opening || slots.length === 0}
          >
            Oops, undo
          </button>
          {onBack && phase === "set" && slots.length === 0 ? (
            <button
              type="button"
              className="toy-btn bg-[#e9d5ff] px-5 py-2.5 text-sm text-[#5b2a4a]"
              onClick={onBack}
              disabled={opening}
            >
              Back
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
