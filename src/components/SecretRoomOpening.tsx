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
 * Dreamy secret-room gate — diary left / passcode right on desktop,
 * stacked on mobile, locked to the viewport (no scroll).
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
      className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden
        bg-gradient-to-b from-[#FFE5EC] via-[#FFF0F5] to-[#FCE7F3] px-4 py-3 select-none sm:py-4"
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

      {/* Compact header branding */}
      <div className="relative z-10 mb-3 shrink-0 text-center md:mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-pink-400">
          {club.vaultType === "squad" ? "SQUADVAULT" : "BESTIEVAULT"}
        </p>
        <h1 className="secret-room-title club-title flex items-center justify-center gap-2 text-2xl font-black text-pink-600 md:text-3xl">
          <span aria-hidden>{emblem}</span> {title}
        </h1>
      </div>

      {/* Main: stacked mobile · side-by-side desktop */}
      <div
        className={`relative z-10 flex w-full max-w-4xl shrink-0 flex-col items-center justify-center gap-6
          md:flex-row md:gap-12
          ${opening ? "pointer-events-none opacity-0 transition-opacity duration-700" : ""}`}
      >
        {/* LEFT: 3D diary */}
        <div className="flex shrink-0 flex-col items-center justify-center">
          <div className="relative" style={{ perspective: 1200 }}>
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[58%] h-28 w-[70%] -translate-x-1/2 rounded-[100%]
                bg-pink-400/25 blur-2xl md:h-40"
            />
            <button
              type="button"
              onClick={tapPadlock}
              disabled={opening}
              aria-label="Tap diary to focus passcode"
              className={`relative mx-auto block w-40 origin-center outline-none transition
                hover:scale-105 active:scale-[0.98] sm:w-56 md:w-72
                ${opening ? "animate-[secret-cover-open_1s_ease-in_forwards]" : "animate-diary-welcome"}
                ${lockClicked ? "scale-105" : ""}`}
            >
              <span
                className="relative block h-52 overflow-hidden rounded-3xl border-4 border-white/80
                  shadow-2xl sm:h-72 md:h-96"
              >
                <Image
                  src="/fuzzy-diary-cover.png"
                  alt="Secret Club diary cover"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 14rem, 18rem"
                />
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-2 left-1/2 h-4 w-[72%] -translate-x-1/2 rounded-[100%]
                  bg-pink-900/20 blur-md"
              />
            </button>
          </div>
          <p className="mt-3 rounded-full bg-white/70 px-4 py-1.5 text-xs font-bold text-pink-400 shadow-sm">
            ✨ Tap the diary or enter your passcode ✨
          </p>
        </div>

        {/* RIGHT: 3-key lockbox */}
        <div
          className={`secret-room-lockbox w-full max-w-[360px] shrink-0 rounded-3xl border-2 border-pink-200
            bg-white/95 p-5 shadow-2xl backdrop-blur-md transition md:p-6
            ${lockClicked ? "ring-4 ring-pink-300/70" : ""}`}
        >
          <p className="mb-3 text-center text-xs font-black text-pink-500">
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
          <button
            type="button"
            className="mt-3 w-full text-center text-[11px] font-bold text-pink-400 underline hover:text-pink-600"
            onClick={() => {
              clearLocalClub();
              router.replace("/");
            }}
          >
            Forgot code? Ask your bestie · Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default SecretRoomOpening;
