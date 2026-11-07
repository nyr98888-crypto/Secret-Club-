"use client";

import { useEffect, useState } from "react";
import { playPokeSound, type PokeSoundType } from "@/utils/pokeAudio";
import { isFreePokeId } from "@/lib/vaultAccess";

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
    id: "bestie-pop",
    icon: "🫧",
    title: "Bestie Pop",
    soundType: "pop",
    sealColor: "linear-gradient(135deg, #7dd3fc 0%, #f472b6 100%)",
  },
  {
    id: "secret-knock",
    icon: "🚪",
    title: "Secret Knock",
    soundType: "knock",
    sealColor: "linear-gradient(135deg, #fbbf24 0%, #fb923c 100%)",
  },
  {
    id: "magic-wish",
    icon: "✨",
    title: "Magic Wish",
    soundType: "magic",
    sealColor: "linear-gradient(135deg, #c084fc 0%, #818cf8 100%)",
  },
  {
    id: "fairy-chime",
    icon: "🔔",
    title: "Fairy Chime",
    soundType: "fairy",
    sealColor: "linear-gradient(135deg, #fde047 0%, #f9a8d4 100%)",
  },
  {
    id: "sweet-snick",
    icon: "🍬",
    title: "Sweet Snick",
    soundType: "sweet",
    sealColor: "linear-gradient(135deg, #fb7185 0%, #f472b6 100%)",
  },
  {
    id: "camera-snap",
    icon: "📸",
    title: "Camera Snap",
    soundType: "camera",
    sealColor: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
  },
  {
    id: "drip-drop",
    icon: "💧",
    title: "Drip Drop",
    soundType: "drip",
    sealColor: "linear-gradient(135deg, #67e8f9 0%, #38bdf8 100%)",
  },
  {
    id: "kitten-purr",
    icon: "🐱",
    title: "Kitten Purr",
    soundType: "purr",
    sealColor: "linear-gradient(135deg, #fdba74 0%, #fb7185 100%)",
  },
  {
    id: "ding-dong",
    icon: "🛎️",
    title: "Ding Dong",
    soundType: "ding",
    sealColor: "linear-gradient(135deg, #fde047 0%, #fbbf24 100%)",
  },
  {
    id: "star-twinkle",
    icon: "🌟",
    title: "Star Twinkle",
    soundType: "twinkle",
    sealColor: "linear-gradient(135deg, #fef08a 0%, #c084fc 100%)",
  },
  {
    id: "love-sparkle",
    icon: "💖",
    title: "Love Sparkle",
    soundType: "love",
    sealColor: "linear-gradient(135deg, #f472b6 0%, #fb7185 100%)",
  },
  {
    id: "secret-whisper",
    icon: "🤫",
    title: "Secret Whisper",
    soundType: "whisper",
    sealColor: "linear-gradient(135deg, #e9d5ff 0%, #a78bfa 100%)",
  },
];

type SweetPokeModalProps = {
  open: boolean;
  onClose: () => void;
  onStickPoke: (poke: SweetPoke) => void;
  isVip?: boolean;
  onRequestVip?: (reason?: string) => void;
};

export function SweetPokeModal({
  open,
  onClose,
  onStickPoke,
  isVip = false,
  onRequestVip,
}: SweetPokeModalProps) {
  const [selectedPoke, setSelectedPoke] = useState<SweetPoke>(POKE_OPTIONS[0]);

  useEffect(() => {
    if (!open) return;
    setSelectedPoke(POKE_OPTIONS[0]);
  }, [open]);

  if (!open) return null;

  function handlePick(poke: SweetPoke) {
    if (!isVip && !isFreePokeId(poke.id)) {
      onRequestVip?.(
        "💖 Unlock Full Studio ($4.99) for every Sound Charm.",
      );
      return;
    }
    setSelectedPoke(poke);
    onStickPoke(poke);
    window.setTimeout(() => onClose(), 0);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sweet-poke-title"
      onClick={onClose}
    >
      <div
        className="my-auto flex max-h-[90vh] w-full max-w-sm flex-col items-center gap-5 overflow-y-auto rounded-3xl border-4 border-pink-300 bg-white p-6 pb-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 text-center">
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

        <div className="grid w-full shrink-0 grid-cols-3 gap-2.5 sm:gap-3">
          {POKE_OPTIONS.map((poke) => {
            const isSelected = selectedPoke.id === poke.id;
            const locked = !isVip && !isFreePokeId(poke.id);
            return (
              <button
                key={poke.id}
                type="button"
                onClick={() => handlePick(poke)}
                onPointerEnter={() => {
                  setSelectedPoke(poke);
                  if (!locked) playPokeSound(poke.soundType);
                }}
                className={`relative flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2
                  transition active:scale-95 ${
                    isSelected
                      ? "border-pink-400 bg-pink-50 shadow-md ring-2 ring-pink-200"
                      : "border-pink-100 bg-white hover:border-pink-200"
                  } ${locked ? "opacity-80" : ""}`}
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full text-xl text-white shadow ${
                    locked ? "opacity-60" : ""
                  }`}
                  style={{
                    backgroundImage: poke.sealColor,
                    backgroundColor: "#f472b6",
                  }}
                  aria-hidden
                >
                  {poke.icon}
                </span>
                <span className="text-center text-[0.62rem] font-black leading-tight text-slate-700">
                  {poke.title}
                </span>
                {locked ? (
                  <span className="pointer-events-none absolute right-1 top-1 text-[0.65rem]">
                    🔒
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] w-full shrink-0 rounded-full border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default SweetPokeModal;
