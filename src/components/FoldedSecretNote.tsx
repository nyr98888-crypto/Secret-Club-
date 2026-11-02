"use client";

import { useState } from "react";
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

  function handleToggle(e: React.SyntheticEvent) {
    e.stopPropagation();
    playPokeSound(poke.soundType);
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
        /* Closed: envelope / wax-sealed charm */
        <div className="flex min-h-[48px] items-center gap-2 rounded-2xl border-2 border-pink-300 bg-white/95 px-3 py-2 shadow-md transition-transform hover:scale-105 active:scale-95">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-lg shadow-sm ${poke.sealColor}`}
          >
            {poke.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black leading-none text-slate-800">
              {poke.title}
            </span>
            <span className="animate-pulse text-[9px] font-bold text-pink-500">
              Tap to play 🎵
            </span>
          </div>
        </div>
      ) : (
        /* Unfolded pop state */
        <div className="relative flex min-w-[170px] flex-col items-center gap-2 rounded-3xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-orange-50 p-4 shadow-xl">
          <span className="animate-bounce text-4xl" aria-hidden>
            {poke.icon}
          </span>
          <span className="text-sm font-black text-slate-800">
            {poke.title}!
          </span>
          <span className="rounded-full border border-amber-200 bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            {fromLabel}
          </span>
          <span className="pt-1 text-[9px] text-pink-500">Tap to fold back</span>
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
