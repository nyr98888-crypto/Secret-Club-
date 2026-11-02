"use client";

import { useState } from "react";
import { ensureAudio, playPop } from "@/lib/audio";
import { vibrateTap } from "@/lib/haptics";

interface ThemePack {
  icon: string;
  adjectives: string[];
  nouns: string[];
}

const THEME_PACKS: ThemePack[] = [
  {
    icon: "🍓",
    adjectives: ["Strawberry", "Sweet", "Pink Sugar", "Berry Cute"],
    nouns: ["Shortcakes", "Boba Squad", "Club", "Vault"],
  },
  {
    icon: "🐼",
    adjectives: ["Sparkle", "Chubby", "Cozy", "Boba"],
    nouns: ["Pandas", "Paws", "Squad", "Crew"],
  },
  {
    icon: "🦄",
    adjectives: ["Magic", "Pastel", "Rainbow", "Dreamy"],
    nouns: ["Unicorns", "Fairies", "Stars", "Squad"],
  },
  {
    icon: "🐱",
    adjectives: ["Cloud", "Velvet", "Fluffy", "Sleepy"],
    nouns: ["Kittens", "Purrs", "Society", "Besties"],
  },
  {
    icon: "⭐",
    adjectives: ["Glitter", "Cosmic", "Shining", "Golden"],
    nouns: ["Stars", "Novas", "Club", "Angels"],
  },
  {
    icon: "🌸",
    adjectives: ["Cherry", "Blossom", "Daisy", "Pastel"],
    nouns: ["Petals", "Fairies", "Blossoms", "Sisters"],
  },
  {
    icon: "💖",
    adjectives: ["Sweetheart", "Secret", "Forever", "Sparkle"],
    nouns: ["Hearts", "Angels", "Sisters", "Vault"],
  },
  {
    icon: "🧁",
    adjectives: ["Vanilla", "Frosting", "Sprinkle", "Glazed"],
    nouns: ["Cupcakes", "Treats", "Society", "Babes"],
  },
  {
    icon: "🎀",
    adjectives: ["Preppy", "Satin", "Little", "Vintage"],
    nouns: ["Ribbons", "Dolls", "Club", "Besties"],
  },
];

const FREE_ICONS = ["🍓", "🐼", "🌸", "💖", "🐱", "⭐", "🧁", "🎀"];
const VIP_ICONS = ["🦄", "👑", "💎", "🪽", "🫧", "🔮", "✨", "🧸"];

interface SlotMachineRollerProps {
  onNameSelected: (name: string, icon: string) => void;
  onOpenVipModal?: () => void;
  isVip?: boolean;
}

export function SlotMachineRoller({
  onNameSelected,
  onOpenVipModal,
  isVip = false,
}: SlotMachineRollerProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIcon, setCurrentIcon] = useState("🍓");
  const [currentAdj, setCurrentAdj] = useState("Strawberry");
  const [currentNoun, setCurrentNoun] = useState("Shortcakes");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const spin = () => {
    if (isSpinning) return;
    void ensureAudio();
    vibrateTap();
    playPop();
    setIsSpinning(true);
    setIsPickerOpen(false);

    const spinDuration = 1200;
    const intervalTime = 60;
    const allIcons = [...FREE_ICONS, ...VIP_ICONS];
    const allAdjs = THEME_PACKS.flatMap((t) => t.adjectives);
    const allNouns = THEME_PACKS.flatMap((t) => t.nouns);

    const interval = window.setInterval(() => {
      setCurrentIcon(allIcons[Math.floor(Math.random() * allIcons.length)]);
      setCurrentAdj(allAdjs[Math.floor(Math.random() * allAdjs.length)]);
      setCurrentNoun(allNouns[Math.floor(Math.random() * allNouns.length)]);
    }, intervalTime);

    window.setTimeout(() => {
      window.clearInterval(interval);
      const chosenTheme =
        THEME_PACKS[Math.floor(Math.random() * THEME_PACKS.length)];
      const finalAdj =
        chosenTheme.adjectives[
          Math.floor(Math.random() * chosenTheme.adjectives.length)
        ];
      const finalNoun =
        chosenTheme.nouns[Math.floor(Math.random() * chosenTheme.nouns.length)];

      // If landed on VIP icon and user is not VIP, fallback to a free matching icon
      let finalIcon = chosenTheme.icon;
      if (!isVip && VIP_ICONS.includes(finalIcon)) {
        finalIcon = "💖";
      }

      setCurrentIcon(finalIcon);
      setCurrentAdj(finalAdj);
      setCurrentNoun(finalNoun);
      setIsSpinning(false);

      onNameSelected(`${finalAdj} ${finalNoun}`, finalIcon);
    }, spinDuration);
  };

  const handleSelectIcon = (icon: string, isLocked: boolean) => {
    if (isLocked && !isVip) {
      onOpenVipModal?.();
      return;
    }
    void ensureAudio();
    vibrateTap();
    playPop();
    setCurrentIcon(icon);
    setIsPickerOpen(false);
    onNameSelected(`${currentAdj} ${currentNoun}`, icon);
  };

  return (
    <div className="relative flex w-full flex-col items-center gap-4 font-toy">
      {/* Slot Machine Window */}
      <div className="relative w-full rounded-3xl border-4 border-pink-300 bg-gradient-to-b from-pink-100 to-purple-50 p-3 shadow-[inset_0_4px_10px_rgba(0,0,0,0.06),0_8px_0_#f472b6]">
        <div className="flex h-20 items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-pink-200 bg-white/90 px-4">
          {/* Reel 1: Clickable Icon with Edit Indicator */}
          <button
            type="button"
            onClick={() => !isSpinning && setIsPickerOpen(!isPickerOpen)}
            className={`group relative rounded-xl border border-dashed border-pink-300/80 p-1.5 transition-all hover:bg-pink-50 active:scale-95 ${
              isSpinning ? "animate-bounce blur-[1px]" : "scale-110"
            }`}
            title="Tap to change mascot"
          >
            <span className="text-4xl">{currentIcon}</span>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[10px] text-white shadow">
              ✏️
            </span>
          </button>

          <div className="mx-1 h-10 w-[2px] rounded-full bg-pink-100" />

          {/* Reel 2: Adjective */}
          <div
            className={`text-xl font-black text-pink-600 transition-transform sm:text-2xl ${
              isSpinning ? "blur-[1px]" : ""
            }`}
          >
            {currentAdj}
          </div>

          {/* Reel 3: Noun */}
          <div
            className={`text-xl font-black text-purple-600 transition-transform sm:text-2xl ${
              isSpinning ? "blur-[1px]" : ""
            }`}
          >
            {currentNoun}
          </div>
        </div>
      </div>

      {/* Mascot Picker Popover */}
      {isPickerOpen ? (
        <div className="z-20 flex w-full animate-[pop_0.2s_ease] flex-col gap-3 rounded-3xl border-4 border-pink-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pick Your Club Mascot
            </span>
            <button
              type="button"
              onClick={() => setIsPickerOpen(false)}
              className="text-xs font-bold text-pink-500 hover:text-pink-600"
            >
              Close
            </button>
          </div>

          {/* Free Mascots */}
          <div className="grid grid-cols-4 gap-2">
            {FREE_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => handleSelectIcon(icon, false)}
                className={`flex h-12 items-center justify-center rounded-2xl border-2 text-2xl transition-all hover:scale-105 active:scale-95 ${
                  currentIcon === icon
                    ? "border-pink-400 bg-pink-100 shadow-sm"
                    : "border-pink-100 bg-pink-50/50 hover:border-pink-300"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>

          {/* VIP Mascots Section */}
          <div className="border-t border-pink-100 pt-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] font-black uppercase text-purple-600">
                ✨ Magic Chest Mascots
              </span>
              {!isVip ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                  Locked
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {VIP_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleSelectIcon(icon, true)}
                  className={`relative flex h-12 items-center justify-center rounded-2xl border-2 text-2xl transition-all hover:scale-105 active:scale-95 ${
                    currentIcon === icon
                      ? "border-purple-400 bg-purple-100"
                      : "border-purple-100 bg-purple-50/40 hover:border-purple-300"
                  }`}
                >
                  {icon}
                  {!isVip ? (
                    <span className="absolute right-1 top-1 text-[10px]">🔒</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Chunky Arcade Pull Button */}
      <button
        type="button"
        onClick={spin}
        disabled={isSpinning}
        className="w-full rounded-2xl border-b-4 border-pink-600 bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-500
          px-6 py-4 text-lg font-black uppercase tracking-wide text-white shadow-[0_6px_0_#db2777]
          transition-all hover:brightness-105 active:translate-y-1 active:border-b-0 active:shadow-none
          disabled:opacity-80"
      >
        {isSpinning ? "✨ Spinning... ✨" : "🎰 Spin Magic Name! 🎰"}
      </button>
    </div>
  );
}

export default SlotMachineRoller;
