"use client";

import Image from "next/image";
import { useState } from "react";
import { ensureAudio, playPop } from "@/lib/audio";
import { vibrateTap } from "@/lib/haptics";
import { SiteLegalLinks } from "@/components/SiteLegal";

interface HeroSectionProps {
  onStartClub: () => void;
}

export function HeroSection({ onStartClub }: HeroSectionProps) {
  const [zooming, setZooming] = useState(false);

  function openDiary() {
    if (zooming) return;
    void ensureAudio();
    vibrateTap();
    playPop();
    setZooming(true);
    window.setTimeout(() => onStartClub(), 820);
  }

  return (
    <section className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-5 pb-10 pt-8">
      {/* Playful sticky dots */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(#ff8fab 1.5px, transparent 1.5px), radial-gradient(#c4b5fd 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px, 36px 36px",
          backgroundPosition: "0 0, 14px 18px",
        }}
      />

      <p className="relative z-10 mb-2 font-toy text-lg font-semibold text-pink-500">
        Psst… open me
      </p>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center">
        <div
          className={`relative mb-8 transition-opacity duration-500 ${
            zooming ? "opacity-100" : "opacity-100"
          }`}
        >
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-pink-300/50 via-fuchsia-200/40 to-sky-200/40 blur-3xl sm:h-80 sm:w-80" />
          <div
            className={`relative select-none ${
              zooming ? "animate-diary-zoom" : "animate-float"
            }`}
          >
            <Image
              src="/hero-book.png"
              alt="Fuzzy secret diary"
              width={560}
              height={560}
              priority
              className="relative z-10 mx-auto h-auto w-[min(78vw,22rem)] object-contain drop-shadow-[0_28px_40px_rgba(236,72,153,0.35)] sm:w-[min(70vw,26rem)]"
            />
            {/* Soft lock glow focus during zoom */}
            {zooming ? (
              <div className="pointer-events-none absolute left-1/2 top-[58%] z-20 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-200/70 blur-md animate-pulse" />
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={openDiary}
          disabled={zooming}
          className={`toy-btn relative z-20 max-w-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-400
            px-6 py-4 text-center text-xl font-bold tracking-wide text-white sm:px-10 sm:text-2xl
            ${zooming ? "opacity-0 scale-90 transition-all duration-300" : "animate-toy-bounce"}`}
        >
          🎀 OPEN MY DIARY 🎀
        </button>

        <div
          className={`relative z-20 mt-8 ${zooming ? "pointer-events-none opacity-0" : ""}`}
        >
          <SiteLegalLinks />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
