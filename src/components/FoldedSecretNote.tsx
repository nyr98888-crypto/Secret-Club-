"use client";

import { useRef, useState } from "react";
import type { SweetPoke } from "./SweetPokeModal";
import { playPokeSound } from "@/utils/pokeAudio";

type FoldedSecretNoteProps = {
  poke: SweetPoke;
  /** Optional label under the closed chip */
  fromLabel?: string;
  onDelete?: () => void;
  className?: string;
};

export function FoldedSecretNote({
  poke,
  fromLabel = "From your squad ✨",
  onDelete,
  className = "",
}: FoldedSecretNoteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [squish, setSquish] = useState(false);
  const squishTimer = useRef<number | null>(null);

  function bounce() {
    setSquish(true);
    if (squishTimer.current) window.clearTimeout(squishTimer.current);
    squishTimer.current = window.setTimeout(() => setSquish(false), 420);
  }

  function handleToggle(e: React.SyntheticEvent) {
    e.stopPropagation();
    playPokeSound(poke.soundType);
    bounce();
    setIsOpen((v) => !v);
  }

  return (
    <div
      className={`group relative cursor-pointer select-none ${className}`}
      onClick={handleToggle}
      onPointerDown={(e) => e.stopPropagation()}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-label={`${poke.title}. Tap to ${isOpen ? "fold" : "play"}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle(e);
        }
      }}
    >
      {!isOpen ? (
        /* Closed: folded pastel envelope / heart badge */
        <div
          className={`poke-envelope relative flex min-h-[52px] items-center gap-2.5 overflow-hidden
            rounded-[1.35rem] border-2 border-pink-300/90 bg-gradient-to-br from-pink-50 via-white to-violet-50
            px-3 py-2 shadow-[0_8px_18px_rgba(244,114,182,0.22)]
            ${squish ? "poke-squash" : ""}`}
        >
          {/* Folded flap */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-pink-200/70 to-transparent"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2
              border-l-[18px] border-r-[18px] border-t-[14px]
              border-l-transparent border-r-transparent border-t-pink-300/80"
          />

          <div
            className={`relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full
              bg-gradient-to-br text-lg shadow-sm ring-2 ring-white ${poke.sealColor}`}
          >
            {poke.icon}
            {/* Tiny blinking speaker */}
            <span
              aria-hidden
              className="poke-speaker absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center
                rounded-full border border-white bg-white text-[0.55rem] shadow"
            >
              🔊
            </span>
          </div>

          <div className="relative z-[1] flex min-w-0 flex-col">
            <span className="truncate text-[11px] font-black leading-none text-slate-800">
              {poke.title}
            </span>
            <span className="mt-0.5 text-[9px] font-bold text-pink-500">
              Tap to play 💌
            </span>
          </div>
        </div>
      ) : (
        /* Unfolded pop state */
        <div
          className={`relative flex min-w-[170px] flex-col items-center gap-2 rounded-3xl
            border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-orange-50 p-4 shadow-xl
            ${squish ? "poke-squash" : ""}`}
        >
          <span className="animate-bounce text-4xl" aria-hidden>
            {poke.icon}
          </span>
          <span className="text-sm font-black text-slate-800">
            {poke.title}!
          </span>
          <span className="rounded-full border border-amber-200 bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            {fromLabel}
          </span>
          <span className="inline-flex items-center gap-1 pt-1 text-[9px] font-bold text-pink-500">
            <span className="poke-speaker" aria-hidden>
              🔊
            </span>
            Tap to fold back
          </span>
        </div>
      )}

      {onDelete ? (
        <button
          type="button"
          aria-label={`Delete ${poke.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -right-2 -top-2 grid min-h-[48px] min-w-[48px] place-items-center rounded-full
            border-2 border-white bg-rose-500 text-sm font-bold text-white shadow
            opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100
            md:min-h-[32px] md:min-w-[32px]"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

export default FoldedSecretNote;
