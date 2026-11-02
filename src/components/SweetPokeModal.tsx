"use client";

import { useEffect, useState } from "react";
import { playPokeSound, type PokeSoundType } from "@/utils/pokeAudio";

export type SweetPoke = {
  id: string;
  icon: string;
  title: string;
  soundType: PokeSoundType;
  sealColor: string;
};

export const POKE_OPTIONS: SweetPoke[] = [
  {
    id: "heart",
    icon: "💖",
    title: "Bestie Hug",
    soundType: "magic",
    sealColor: "from-pink-400 to-rose-400",
  },
  {
    id: "knock",
    icon: "🚪",
    title: "Knock Knock",
    soundType: "knock",
    sealColor: "from-amber-400 to-orange-400",
  },
  {
    id: "sparkle",
    icon: "✨",
    title: "Magic Vibe",
    soundType: "bell",
    sealColor: "from-purple-400 to-indigo-400",
  },
  {
    id: "snack",
    icon: "🍓",
    title: "Snack Break",
    soundType: "pop",
    sealColor: "from-red-400 to-pink-500",
  },
  {
    id: "shh",
    icon: "🤫",
    title: "Top Secret",
    soundType: "marimba",
    sealColor: "from-fuchsia-400 to-pink-400",
  },
  {
    id: "bell",
    icon: "🔔",
    title: "Ding Dong",
    soundType: "bell",
    sealColor: "from-yellow-300 to-amber-400",
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
    playPokeSound(poke.soundType);
    // Place first, then close — ensures canvas receives the charm
    onStickPoke(poke);
    window.setTimeout(() => onClose(), 0);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sweet-poke-title"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border-4 border-pink-300 bg-white p-6 shadow-2xl"
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
            One tap sticks a sealed sound charm on the page!
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-3">
          {POKE_OPTIONS.map((poke) => {
            const isSelected = selectedPoke.id === poke.id;
            return (
              <button
                key={poke.id}
                type="button"
                onPointerUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePick(poke);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePick(poke);
                }}
                className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all active:scale-95 ${
                  isSelected
                    ? "scale-105 border-pink-500 bg-pink-50 shadow-md"
                    : "border-pink-100 bg-white hover:border-pink-200 hover:bg-pink-50/50"
                }`}
              >
                <span className="mb-1 text-3xl" aria-hidden>
                  {poke.icon}
                </span>
                <span className="text-[11px] font-bold text-slate-700">
                  {poke.title}
                </span>
                <span className="mt-0.5 text-[9px] text-pink-500">🔊 Tap to stick</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-[48px] w-full rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-200 active:scale-95"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default SweetPokeModal;
