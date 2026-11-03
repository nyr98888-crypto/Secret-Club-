"use client";

import { useRef, useState } from "react";
import { ensureAudio, playShutterClick } from "@/lib/audio";
import {
  PHOTO_FILE_ACCEPT,
  processPhotoFile,
} from "@/lib/photoDataUrl";

type AddSnapButtonProps = {
  onSnapReady: (photoSrc: string) => void;
  className?: string;
};

/**
 * Chunky kid-friendly photo launcher docked beside the asset drawer.
 */
export function AddSnapButton({ onSnapReady, className = "" }: AddSnapButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openPicker() {
    if (busy) return;
    setError("");
    void ensureAudio();
    const input = inputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={openPicker}
        className={`flex min-h-[48px] shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400
          px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#be185d]
          transition-all active:translate-y-1 active:shadow-none disabled:opacity-70 ${className}
          ${busy ? "animate-pulse" : ""}`}
        aria-label="Add my photo snap"
        aria-busy={busy}
      >
        <span className="text-lg" aria-hidden>
          {busy ? "⏳" : "📸"}
        </span>
        <span className="whitespace-nowrap">
          {busy ? "Processing…" : "Add Snap!"}
        </span>
      </button>
      {error ? (
        <p className="mt-1 text-center text-[0.65rem] font-bold text-[#b91c1c]">
          {error}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_FILE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const input = e.currentTarget;
          const file = input.files?.[0];
          // Always clear so the same photo / cancel → re-pick fires onChange again
          input.value = "";
          if (!file) return;
          setBusy(true);
          setError("");
          void processPhotoFile(file)
            .then((dataUrl) => {
              void ensureAudio().then(() => playShutterClick());
              onSnapReady(dataUrl);
            })
            .catch((err) => {
              console.error("Snap read failed", err);
              setError("Couldn’t load that photo. Try another one?");
            })
            .finally(() => setBusy(false));
        }}
      />
    </>
  );
}

export default AddSnapButton;
