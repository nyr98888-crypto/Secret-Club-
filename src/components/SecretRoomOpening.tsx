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
      <h1 className="relative z-10 mb-4 max-w-md text-center font-toy text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
        <span aria-hidden>{emblem}</span> {title}
      </h1>

      {/* 3D fuzzy diary cover — hero welcome above the lock */}
      <div
        className={`relative z-10 mb-4 transition-all duration-700 ${
          opening ? "scale-125 opacity-0" : "scale-100 opacity-100"
        }`}
        style={{ perspective: 1200 }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[58%] h-40 w-[70%] -translate-x-1/2 rounded-[100%]
            bg-pink-400/25 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full
            bg-gradient-to-tr from-pink-300/45 via-fuchsia-200/35 to-rose-200/40 blur-3xl sm:h-[22rem] sm:w-[22rem]"
        />

        <button
          type="button"
          onClick={tapPadlock}
          disabled={opening}
          aria-label="Tap fuzzy diary to unlock"
          className={`relative mx-auto block w-[min(72vw,18.5rem)] origin-center outline-none
            transition active:scale-[0.98]
            ${opening ? "animate-[secret-cover-open_1s_ease-in_forwards]" : "animate-diary-welcome"}
            ${lockClicked ? "scale-105" : ""}`}
        >
          <span
            className="relative block overflow-hidden rounded-[1.6rem]
              shadow-[0_28px_50px_-8px_rgba(190,24,93,0.45),0_12px_24px_rgba(244,114,182,0.35),0_0_0_1px_rgba(255,255,255,0.55)]"
            style={{ aspectRatio: "3 / 4" }}
          >
            <Image
              src="/fuzzy-diary-cover.png"
              alt="Secret Club fuzzy diary cover"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 640px) 72vw, 296px"
            />
          </span>
          {/* Soft ground shadow under the floating book */}
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-3 left-1/2 h-5 w-[72%] -translate-x-1/2 rounded-[100%]
              bg-pink-900/20 blur-md"
          />
        </button>
      </div>

      <p
        className={`relative z-10 mb-4 rounded-full border border-pink-200 bg-white/85 px-4 py-2 text-center
          text-xs font-extrabold text-pink-600 shadow-sm backdrop-blur-sm transition
          ${opening ? "opacity-0" : "animate-pulse"}`}
      >
        ✨ Tap the diary or enter your passcode to unlock ✨
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
