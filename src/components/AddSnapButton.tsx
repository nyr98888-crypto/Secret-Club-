"use client";

import { useRef } from "react";
import { ensureAudio, playShutterClick } from "@/lib/audio";

type AddSnapButtonProps = {
  onSnapReady: (photoSrc: string) => void;
  className?: string;
};

/**
 * Chunky kid-friendly photo launcher docked beside the asset drawer.
 */
export function AddSnapButton({ onSnapReady, className = "" }: AddSnapButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void ensureAudio();
          inputRef.current?.click();
        }}
        className={`flex min-h-[48px] shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400
          px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#be185d]
          transition-all active:translate-y-1 active:shadow-none ${className}`}
        aria-label="Add my photo snap"
      >
        <span className="text-lg" aria-hidden>
          📸
        </span>
        <span className="whitespace-nowrap">Add Snap!</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          void ensureAudio().then(() => playShutterClick());
          onSnapReady(url);
          e.target.value = "";
        }}
      />
    </>
  );
}

export default AddSnapButton;
