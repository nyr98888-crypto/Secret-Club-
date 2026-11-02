"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import {
  PASSCODE_LENGTH,
  clearLocalClub,
  passcodesMatch,
  setVaultUnlocked,
  type LocalClub,
} from "@/lib/localClub";
import { EmojiPad } from "./EmojiPad";
import { UnlockPayoff } from "./UnlockPayoff";
import { vibrateTap, vibrateUnlock } from "@/lib/haptics";
import { ensureAudio, playChime, playPop, playUnlockSound } from "@/lib/audio";
import { useRouter } from "next/navigation";

type BurstBit = {
  id: number;
  left: string;
  delay: string;
  emoji: string;
  dx: string;
  dy: string;
};

type SecretRoomOpeningProps = {
  club: LocalClub;
  scrapbookName?: string;
  scrapbookIcon?: string;
  onUnlocked: () => void;
};

/**
 * Dreamy secret-room gate — floating locked diary + emoji passcode.
 * Recovers the original hero-book entrance experience for returning members.
 */
export function SecretRoomOpening({
  club,
  scrapbookName,
  scrapbookIcon,
  onUnlocked,
}: SecretRoomOpeningProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [payoff, setPayoff] = useState(false);
  const [opening, setOpening] = useState(false);
  const [lockClicked, setLockClicked] = useState(false);
  const [burst, setBurst] = useState<BurstBit[]>([]);

  const title = scrapbookName || club.clubName;
  const emblem = scrapbookIcon || club.clubIcon || "🍓";

  const sparkles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        delay: `${(i % 10) * 0.35}s`,
        size: 3 + (i % 4),
      })),
    [],
  );

  function spawnBurst() {
    const bits: BurstBit[] = Array.from({ length: 22 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 22;
      const dist = 90 + Math.random() * 130;
      return {
        id: i,
        left: "50%",
        delay: `${i * 16}ms`,
        emoji: ["✨", "⭐", "💖", "🌟", "💫"][i % 5],
        dx: `${Math.cos(angle) * dist}px`,
        dy: `${Math.sin(angle) * dist - 30}px`,
      };
    });
    setBurst(bits);
  }

  function tapPadlock() {
    if (opening) return;
    void ensureAudio();
    vibrateTap();
    playPop();
    setLockClicked(true);
    window.setTimeout(() => setLockClicked(false), 600);
  }

  function finishUnlock() {
    setPayoff(true);
    setOpening(true);
    vibrateUnlock();
    void ensureAudio().then(() => playUnlockSound());
    spawnBurst();
    setVaultUnlocked(true);
    window.setTimeout(() => {
      onUnlocked();
    }, 1100);
  }

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden
        bg-gradient-to-br from-pink-200 via-purple-100 to-rose-200 px-4 py-8"
      data-circle={club.vaultType}
      data-aesthetic={club.aesthetic}
    >
      <UnlockPayoff mode={club.vaultType} active={payoff} />

      {/* Fairy dust */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="absolute animate-[secret-sparkle_4.5s_ease-in-out_infinite] rounded-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.85)]"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.55),transparent_55%)]" />
      </div>

      {burst.length > 0 ? (
        <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center overflow-visible">
          {burst.map((b) => (
            <span
              key={b.id}
              className="absolute text-2xl animate-[secret-burst_0.9s_ease-out_forwards]"
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

      <p className="relative z-10 mb-1 font-toy text-sm font-bold uppercase tracking-[0.2em] text-pink-500">
        {club.vaultType === "squad" ? "SquadVault" : "BestieVault"}
      </p>
      <h1 className="relative z-10 mb-6 max-w-md text-center font-toy text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
        {emblem} {title}
      </h1>

      {/* Floating diary stage */}
      <div
        className={`relative z-10 mb-5 transition-all duration-700 ${
          opening ? "scale-125 opacity-0" : "scale-100 opacity-100"
        }`}
        style={{ perspective: 1000 }}
      >
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-pink-300/50 via-fuchsia-200/40 to-sky-200/40 blur-3xl sm:h-96 sm:w-96" />

        <div
          className={`relative ${
            opening ? "animate-[secret-cover-open_1s_ease-in_forwards]" : "animate-float"
          }`}
        >
          {/* Soft CSS hardcover under the hero art for theme emblem */}
          <div
            className="relative mx-auto w-[min(78vw,21.25rem)] overflow-hidden rounded-[1.75rem]
              border-[6px] border-[#f9a8d4] bg-gradient-to-br from-[#fff0f7] via-[#ffe4ef] to-[#fbcfe8]
              shadow-[0_25px_50px_-12px_rgba(244,114,182,0.45)]"
            style={{ aspectRatio: "340 / 460" }}
          >
            <Image
              src="/hero-book.png"
              alt="Locked secret diary"
              fill
              priority
              className={`object-contain p-2 drop-shadow-lg transition duration-500 ${
                opening ? "opacity-0" : "opacity-100"
              }`}
              sizes="340px"
            />

            {/* Theme emblem plate */}
            <div className="pointer-events-none absolute inset-x-8 top-10 z-10 flex flex-col items-center gap-2">
              <span className="grid h-16 w-16 place-items-center rounded-full border-4 border-white/80 bg-white/70 text-4xl shadow-md backdrop-blur-sm">
                {emblem}
              </span>
              <span
                className="max-w-[12rem] truncate rounded-full bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300
                  px-3 py-1 text-center text-[0.7rem] font-black tracking-wide text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                style={{ textShadow: "0 1px 0 rgba(255,255,255,0.6)" }}
              >
                {title}
              </span>
            </div>

            {/* Clasp + interactive padlock hot zone */}
            <button
              type="button"
              onClick={tapPadlock}
              disabled={opening}
              aria-label="Tap padlock to focus unlock"
              className={`absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1
                transition ${lockClicked ? "scale-110" : "hover:scale-105"} active:scale-95`}
            >
              <span
                aria-hidden
                className="h-10 w-4 rounded-sm bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-500 shadow-md ring-1 ring-amber-600/40"
              />
              <span
                className={`grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-pink-300 via-rose-400 to-amber-300
                  text-2xl shadow-[0_8px_20px_rgba(244,114,182,0.55)] ring-4 ring-white/70
                  ${lockClicked ? "animate-pulse" : ""}`}
              >
                🔒
              </span>
            </button>
          </div>
        </div>
      </div>

      <p
        className={`relative z-10 mb-5 rounded-full border border-pink-200 bg-white/80 px-4 py-2 text-center
          text-xs font-extrabold text-pink-600 shadow-sm backdrop-blur-sm transition
          ${opening ? "opacity-0" : "animate-pulse"}`}
      >
        ✨ Tap Padlock or Enter Passcode to Unlock ✨
      </p>

      {/* Passcode pad lives in front of the floating diary */}
      <div
        className={`relative z-20 w-full max-w-md rounded-[1.75rem] border-4 border-white/90
          bg-white/75 p-4 shadow-[0_12px_40px_rgba(74,43,69,0.18)] backdrop-blur-md transition-all duration-500
          ${opening ? "translate-y-8 scale-95 opacity-0" : "opacity-100"}
          ${lockClicked ? "ring-4 ring-pink-300/70" : ""}`}
      >
        <p className="mb-2 text-center text-sm font-bold text-pink-500">
          Enter the 3-key passcode for {club.clubName}
        </p>
        <EmojiPad
          lockKey={`secret-room:${club.createdAt}`}
          clubName={club.clubName}
          vaultUrl="/vault"
          mode="unlock"
          targetLength={PASSCODE_LENGTH}
          onComplete={async (glyphs) => {
            if (opening) return "partial";
            if (glyphs.length < PASSCODE_LENGTH) return "partial";
            if (!passcodesMatch(glyphs, club.passcode)) {
              setError("Wrong key — try again");
              playChime();
              return "wrong";
            }
            setError("");
            finishUnlock();
            return "complete";
          }}
        />
        {error ? (
          <p className="mt-2 text-center text-sm font-bold text-rose-500">{error}</p>
        ) : null}
      </div>

      <button
        type="button"
        className="relative z-10 mt-5 text-xs font-bold text-pink-500/80 underline-offset-2 hover:underline"
        onClick={() => {
          clearLocalClub();
          router.replace("/");
        }}
      >
        Reset / Start Over
      </button>
    </div>
  );
}

export default SecretRoomOpening;
