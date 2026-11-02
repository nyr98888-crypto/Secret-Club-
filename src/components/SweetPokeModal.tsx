"use client";

import { useEffect, useState } from "react";
import { playPokeSound, type PokeSoundType } from "@/utils/pokeAudio";

export type SweetPoke = {
  id: string;
  icon: string;
  title: string;
  soundType: PokeSoundType;
  /** Hex gradient — never Tailwind oklch utilities (breaks PNG export) */
  sealColor: string;
};

export const POKE_OPTIONS: SweetPoke[] = [
  {
    id: "heart",
    icon: "💖",
    title: "Bestie Hug",
    soundType: "magic",
    sealColor: "linear-gradient(135deg, #f472b6 0%, #fb7185 100%)",
  },
  {
    id: "knock",
    icon: "🚪",
    title: "Secret Knock",
    soundType: "knock",
    sealColor: "linear-gradient(135deg, #fbbf24 0%, #fb923c 100%)",
  },
  {
    id: "sparkle",
    icon: "🪄",
    title: "Magic Wish",
    soundType: "bell",
    sealColor: "linear-gradient(135deg, #c084fc 0%, #818cf8 100%)",
  },
  {
    id: "drop",
    icon: "🎵",
    title: "Drop Song",
    soundType: "marimba",
    sealColor: "linear-gradient(135deg, #e879f9 0%, #8b5cf6 100%)",
  },
  {
    id: "snack",
    icon: "🍓",
    title: "Snack Break",
    soundType: "pop",
    sealColor: "linear-gradient(135deg, #f87171 0%, #ec4899 100%)",
  },
  {
    id: "bell",
    icon: "🔔",
    title: "Ding Dong",
    soundType: "bell",
    sealColor: "linear-gradient(135deg, #fde047 0%, #fbbf24 100%)",
  },
];

type SweetPokeModalProps = {
  open: boolean;
  onClose: () => void;
  onStickPoke: (poke: SweetPoke) => void;
};

export function SweetPokeModal({
  open,
  onClose,
  onStickPoke,
}: SweetPokeModalProps) {
  const [selectedPoke, setSelectedPoke] = useState<SweetPoke>(POKE_OPTIONS[0]);

  useEffect(() => {
    if (!open) return;
    setSelectedPoke(POKE_OPTIONS[0]);
  }, [open]);

  if (!open) return null;

  function handlePick(poke: SweetPoke) {
    setSelectedPoke(poke);
    // Placement sound + burst happen on the stamp itself
    onStickPoke(poke);
    window.setTimeout(() => onClose(), 0);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sweet-poke-title"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col items-center gap-5 rounded-t-3xl border-4 border-b-0 border-pink-300 bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:border-b-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-pink-500">
            Send a Sweet Poke
          </span>
          <h3
            id="sweet-poke-title"
            className="mt-2 text-2xl font-black text-slate-800"
          >
            Pick a Sound Charm
          </h3>
          <p className="text-xs text-slate-500">
            One tap stamps a playable charm onto the page!
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-3">
          {POKE_OPTIONS.map((poke) => {
            const isSelected = selectedPoke.id === poke.id;
            return (
              <button
                key={poke.id}
                type="button"
                onClick={() => handlePick(poke)}
                onPointerEnter={() => {
                  setSelectedPoke(poke);
                  playPokeSound(poke.soundType);
                }}
                className={`flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2
                  transition active:scale-95 ${
                    isSelected
                      ? "border-pink-400 bg-pink-50 shadow-md ring-2 ring-pink-200"
                      : "border-pink-100 bg-white hover:border-pink-200"
                  }`}
              >
                <span
                  className="grid h-10 w-10 place-items-center rounded-full text-xl text-white shadow"
                  style={{
                    backgroundImage: poke.sealColor,
                    backgroundColor: "#f472b6",
                  }}
                  aria-hidden
                >
                  {poke.icon}
                </span>
                <span className="text-center text-[0.65rem] font-black leading-tight text-slate-700">
                  {poke.title}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] w-full rounded-full border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default SweetPokeModal;
