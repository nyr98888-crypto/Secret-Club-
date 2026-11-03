"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CANDY_SWATCHES,
  hueToBackdrop,
  type BackdropTheme,
} from "@/lib/backdropTheme";
import { ensureAudio, playChime, playMarimbaPitch, playPop } from "@/lib/audio";
import { useIsCompactLayout } from "@/hooks/useIsCompactLayout";

type Sparkle = { id: number; left: number; top: number };

type BackdropColorPickerProps = {
  open: boolean;
  onClose: () => void;
  theme: BackdropTheme;
  onChange: (theme: BackdropTheme) => void;
  /** Whole launcher wrapper — clicks here should not auto-close */
  rootRef?: React.RefObject<HTMLElement | null>;
};

export function BackdropColorPicker({
  open,
  onClose,
  theme,
  onChange,
  rootRef,
}: BackdropColorPickerProps) {
  const compact = useIsCompactLayout();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [hue, setHue] = useState(theme.hue ?? 320);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [mounted, setMounted] = useState(false);
  const sparkleId = useRef(0);
  const lastToneAt = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof theme.hue === "number") setHue(theme.hue);
  }, [theme.hue, theme.id]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  function spawnSparkle(clientX?: number, clientY?: number) {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const left =
      clientX != null
        ? ((clientX - rect.left) / rect.width) * 100
        : 20 + Math.random() * 60;
    const top =
      clientY != null
        ? ((clientY - rect.top) / rect.height) * 100
        : 55 + Math.random() * 25;
    const id = ++sparkleId.current;
    setSparkles((prev) => [...prev.slice(-14), { id, left, top }]);
    window.setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== id));
    }, 700);
  }

  function pickSwatch(swatch: (typeof CANDY_SWATCHES)[number]) {
    void ensureAudio().then(() => playPop());
    onChange({
      id: swatch.id,
      css: swatch.css,
      dark: swatch.dark,
    });
  }

  function onHueInput(next: number, clientX?: number, clientY?: number) {
    setHue(next);
    onChange(hueToBackdrop(next));
    spawnSparkle(clientX, clientY);
    const now = performance.now();
    if (now - lastToneAt.current > 55) {
      lastToneAt.current = now;
      void ensureAudio().then(() => playMarimbaPitch(next));
    }
  }

  const panelClass = compact
    ? `fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg max-w-[90vw]
        animate-[mood-pop_0.28s_ease-out] rounded-t-2xl border-2 border-b-0 border-[#2D0C1E]
        bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]
        shadow-2xl`
    : `fixed top-20 left-1/2 z-50 w-[min(20rem,90vw)] max-w-[90vw] -translate-x-1/2
        animate-[mood-pop_0.28s_ease-out] rounded-2xl border-2 border-[#2D0C1E]
        bg-white p-4 shadow-2xl`;

  const ui = (
    <>
      {/* Click-outside / soft backdrop — closes picker */}
      <div
        role="presentation"
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={() => {
          // Don't close when tapping the Room Vibes trigger itself
          onClose();
        }}
        onPointerDown={(e) => {
          if (rootRef?.current?.contains(e.target as Node)) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={panelClass}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2 pt-1">
          <h2
            id={titleId}
            className="m-0 text-sm font-black tracking-tight text-[#2D0C1E]"
          >
            🎨 Paint Your Room
          </h2>
          <button
            type="button"
            onClick={() => {
              void ensureAudio().then(() => playChime());
              onClose();
            }}
            className="grid h-8 w-8 min-h-[32px] min-w-[32px] shrink-0 place-items-center rounded-full
              bg-pink-100 text-sm font-bold text-[#2D0C1E] transition hover:bg-pink-200 active:scale-95"
            aria-label="Close room paint palette"
          >
            ✕
          </button>
        </div>

        <p className="mb-2 text-[0.65rem] font-extrabold uppercase tracking-wide text-pink-600">
          Room Vibes
        </p>
        <div className="mb-4 grid grid-cols-5 gap-2">
          {CANDY_SWATCHES.map((swatch) => {
            const active = theme.id === swatch.id;
            return (
              <button
                key={swatch.id}
                type="button"
                onClick={() => pickSwatch(swatch)}
                className={`group flex flex-col items-center gap-1 rounded-2xl p-1 transition
                  hover:-translate-y-1 hover:scale-105 active:scale-95
                  ${active ? "ring-2 ring-pink-400 ring-offset-2" : ""}`}
                aria-pressed={active}
                aria-label={swatch.label}
                title={swatch.label}
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#2D0C1E]/25 text-base shadow-md transition group-hover:shadow-lg"
                  style={{
                    backgroundImage: swatch.css,
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                  }}
                  aria-hidden
                >
                  {swatch.emoji}
                </span>
                <span className="w-full truncate text-center text-[0.5rem] font-bold leading-tight text-[#2D0C1E]">
                  {swatch.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[#2D0C1E]/25 bg-[#fff9fc] p-3">
          <p className="mb-2 text-[0.7rem] font-black text-[#2D0C1E]">
            ✨ Magic Color Potion
          </p>
          <input
            type="range"
            min={0}
            max={360}
            value={hue}
            aria-label="Magic color potion hue"
            className="mood-hue-slider w-full cursor-pointer"
            onPointerDown={() => void ensureAudio()}
            onInput={(e) => {
              const el = e.currentTarget;
              const next = Number(el.value);
              const rect = el.getBoundingClientRect();
              const ratio = next / 360;
              onHueInput(
                next,
                rect.left + ratio * rect.width,
                rect.top + rect.height / 2,
              );
            }}
            onChange={(e) => onHueInput(Number(e.target.value))}
          />
          <div className="mt-2 flex items-center justify-between gap-2 text-[0.65rem] font-bold text-[#2D0C1E]/80">
            <span>Drag to mix slime colors</span>
            <span
              className="inline-flex h-5 w-5 shrink-0 rounded-full border border-[#2D0C1E]/30 shadow"
              style={{ backgroundColor: `hsl(${hue} 80% 70%)` }}
              aria-hidden
            />
          </div>

          {sparkles.map((s) => (
            <span
              key={s.id}
              aria-hidden
              className="pointer-events-none absolute h-2 w-2 animate-[mood-sparkle_0.7s_ease-out_forwards] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
              style={{ left: `${s.left}%`, top: `${s.top}%` }}
            />
          ))}
        </div>
      </div>
    </>
  );

  /* Portal to body so header overflow/stacking never clips the panel */
  return createPortal(ui, document.body);
}

type BackdropMagicButtonProps = {
  theme: BackdropTheme;
  onChange: (theme: BackdropTheme) => void;
  /** Phone header: palette icon only */
  iconOnly?: boolean;
};

/** Header launcher + Paint Your Room popover */
export function BackdropMagicButton({
  theme,
  onChange,
  iconOnly = false,
}: BackdropMagicButtonProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapRef} className="relative z-[50]">
      <button
        type="button"
        onClick={() => {
          void ensureAudio().then(() => playChime());
          setOpen((v) => !v);
        }}
        className={
          iconOnly
            ? `grid min-h-[44px] min-w-[44px] cursor-pointer place-items-center rounded-full
                bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 text-base text-white
                shadow-sm transition-all hover:scale-105 active:scale-95`
            : `flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400
                px-3.5 py-1.5 text-xs font-black text-white shadow-sm transition-all hover:scale-105 active:scale-95`
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Room Vibes"
      >
        <span className="inline-block" aria-hidden>
          {iconOnly ? "🎨" : "🪄"}
        </span>
        {!iconOnly ? <span>Room Vibes</span> : null}
      </button>

      <BackdropColorPicker
        open={open}
        onClose={() => setOpen(false)}
        theme={theme}
        onChange={onChange}
        rootRef={wrapRef}
      />
    </div>
  );
}

export default BackdropColorPicker;
