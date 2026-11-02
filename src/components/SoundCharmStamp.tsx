"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SweetPoke } from "./SweetPokeModal";
import { playPokeSound } from "@/utils/pokeAudio";

type Particle = {
  id: number;
  emoji: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
  delay: number;
};

type SoundCharmStampProps = {
  poke: SweetPoke;
  /** Stable element id — burst only once per charm per session */
  charmId?: string;
  fromName?: string;
  /** Fire placement burst + sound once when first mounted */
  burstOnMount?: boolean;
  className?: string;
};

/** Session memory so page remounts don't re-fire the 2s burst */
const BURST_SEEN = new Set<string>();

const BURST_EMOJIS = ["💕", "✨", "💖", "⭐", "🌸", "💫", "💗"];

function makeBurst(count = 14): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 28 + Math.random() * 42;
    return {
      id: i,
      emoji: BURST_EMOJIS[i % BURST_EMOJIS.length],
      x: 50,
      y: 50,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 12,
      rot: Math.random() * 60 - 30,
      delay: Math.random() * 0.25,
    };
  });
}

/**
 * Interactive 3D sound-charm stamp for the scrapbook canvas.
 * Placement: particle burst + sound. Tap anytime: wiggle + replay.
 */
export function SoundCharmStamp({
  poke,
  charmId,
  fromName = "You",
  burstOnMount = true,
  className = "",
}: SoundCharmStampProps) {
  const [wiggle, setWiggle] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bursting, setBursting] = useState(false);
  const didBurst = useRef(false);
  const dragRef = useRef({ x: 0, y: 0, moved: false });
  const wiggleTimer = useRef<number | null>(null);
  const burstTimer = useRef<number | null>(null);

  function triggerWiggle() {
    setWiggle(true);
    if (wiggleTimer.current) window.clearTimeout(wiggleTimer.current);
    wiggleTimer.current = window.setTimeout(() => setWiggle(false), 650);
  }

  function triggerBurst() {
    setParticles(makeBurst());
    setBursting(true);
    if (burstTimer.current) window.clearTimeout(burstTimer.current);
    burstTimer.current = window.setTimeout(() => {
      setBursting(false);
      setParticles([]);
    }, 2000);
  }

  function playCharm() {
    playPokeSound(poke.soundType);
    triggerWiggle();
  }

  useEffect(() => {
    if (!burstOnMount || didBurst.current) return;
    if (charmId && BURST_SEEN.has(charmId)) {
      didBurst.current = true;
      return;
    }
    didBurst.current = true;
    if (charmId) BURST_SEEN.add(charmId);
    playPokeSound(poke.soundType);
    triggerWiggle();
    triggerBurst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstOnMount, charmId]);

  useEffect(
    () => () => {
      if (wiggleTimer.current) window.clearTimeout(wiggleTimer.current);
      if (burstTimer.current) window.clearTimeout(burstTimer.current);
    },
    [],
  );

  return (
    <div
      className={`relative w-full select-none ${className}`}
      onPointerDown={(e) => {
        // Allow parent drag — track movement to distinguish tap vs drag
        dragRef.current = { x: e.clientX, y: e.clientY, moved: false };
      }}
      onPointerMove={(e) => {
        if (
          Math.hypot(e.clientX - dragRef.current.x, e.clientY - dragRef.current.y) >
          8
        ) {
          dragRef.current.moved = true;
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (dragRef.current.moved) return;
        playCharm();
      }}
      role="button"
      tabIndex={0}
      aria-label={`${poke.title} from ${fromName}. Tap to play sound.`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          playCharm();
        }
      }}
    >
      {/* Particle burst layer */}
      {bursting
        ? particles.map((p) => (
            <span
              key={p.id}
              aria-hidden
              className="sound-charm-particle pointer-events-none absolute z-20 text-sm"
              style={
                {
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  "--dx": `${p.dx}px`,
                  "--dy": `${p.dy}px`,
                  "--rot": `${p.rot}deg`,
                  animationDelay: `${p.delay}s`,
                } as CSSProperties
              }
            >
              {p.emoji}
            </span>
          ))
        : null}

      <div
        className={`sound-charm-body relative mx-auto flex w-[92%] flex-col items-center gap-1.5
          rounded-[1.6rem] border-[3px] border-white/90
          px-3 pb-2.5 pt-3 shadow-[0_10px_24px_rgba(74,43,69,0.28),inset_0_1px_0_rgba(255,255,255,0.55)]
          ${wiggle ? "sound-charm-wiggle" : ""}`}
        style={{
          backgroundImage: poke.sealColor.includes("gradient")
            ? poke.sealColor
            : `linear-gradient(135deg, #f472b6 0%, #fb7185 100%)`,
          backgroundColor: "#f472b6",
          transform: "perspective(420px) rotateX(8deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Gloss highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-1 h-4 rounded-full bg-white/35 blur-[1px]"
        />

        <div
          className="relative grid h-14 w-14 place-items-center rounded-2xl border-2 border-white/80
            bg-white/90 text-3xl shadow-md"
          style={{ transform: "translateZ(12px)" }}
        >
          <span aria-hidden className={wiggle ? "animate-bounce" : ""}>
            {poke.icon}
          </span>
          <span
            aria-hidden
            className="poke-speaker absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center
              rounded-full border border-white bg-pink-500 text-[0.6rem] text-white shadow"
          >
            🔊
          </span>
        </div>

        <span
          className="relative z-[1] max-w-full truncate rounded-full border border-white/70 bg-white/95
            px-2.5 py-0.5 text-center text-[0.65rem] font-black leading-tight text-slate-800 shadow-sm"
        >
          {poke.title} from {fromName}
        </span>

        <span className="text-[0.55rem] font-bold text-white/90 drop-shadow">
          Tap to replay ♡
        </span>
      </div>
    </div>
  );
}

export default SoundCharmStamp;
