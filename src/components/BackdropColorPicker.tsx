"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  const sparkleId = useRef(0);
  const lastToneAt = useRef(0);

  useEffect(() => {
    if (typeof theme.hue === "number") setHue(theme.hue);
  }, [theme.hue, theme.id]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onPointer(e: PointerEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (rootRef?.current?.contains(target)) return;
      onClose();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open, onClose, rootRef]);

  if (!open) return null;

  const panelClass = compact
    ? `fixed inset-x-0 bottom-0 z-[90] mx-auto w-full max-w-lg
        animate-[mood-pop_0.28s_ease-out] rounded-t-[1.75rem] border-4 border-b-0 border-pink-200/90
        bg-gradient-to-b from-white via-pink-50/90 to-violet-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]
        shadow-[0_-18px_50px_rgba(74,43,69,0.28)]`
    : `absolute right-0 top-[calc(100%+0.55rem)] z-[80] w-[min(20rem,calc(100vw-1.5rem))]
        origin-top-right animate-[mood-pop_0.28s_ease-out]
        rounded-[1.75rem] border-4 border-pink-200/90 bg-gradient-to-b from-white via-pink-50/90 to-violet-50
        p-3.5 shadow-[0_18px_50px_rgba(74,43,69,0.28)]`;

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

  return (
    <>
      {compact ? (
        <button
          type="button"
          aria-label="Close room paint"
          className="fixed inset-0 z-[85] bg-slate-900/30"
          onClick={onClose}
        />
      ) : null}
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={panelClass}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-2 rounded-b-full bg-gradient-to-r from-pink-200/0 via-white/80 to-violet-200/0"
      />

      <div className="mb-3 flex items-start justify-between gap-2">
        <h2
          id={titleId}
          className="m-0 text-sm font-black tracking-tight text-slate-800"
        >
          🎨 Paint Your Room
        </h2>
        <button
          type="button"
          onClick={() => {
            void ensureAudio().then(() => playChime());
            onClose();
          }}
          className="grid h-8 w-8 place-items-center rounded-full bg-pink-100 text-sm font-black text-pink-600 transition hover:bg-pink-200 active:scale-95"
          aria-label="Close room paint palette"
        >
          ✕
        </button>
      </div>

      <p className="mb-2 text-[0.65rem] font-extrabold uppercase tracking-wide text-pink-500">
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
                className="grid h-11 w-11 place-items-center rounded-full border-2 border-white text-base shadow-md transition group-hover:shadow-lg"
                style={{
                  backgroundImage: swatch.css,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                }}
                aria-hidden
              >
                {swatch.emoji}
              </span>
              <span className="w-full truncate text-center text-[0.5rem] font-bold leading-tight text-slate-700">
                {swatch.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-violet-200 bg-white/70 p-3">
        <p className="mb-2 text-[0.7rem] font-black text-violet-600">
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
            onHueInput(next, rect.left + ratio * rect.width, rect.top + rect.height / 2);
          }}
          onChange={(e) => onHueInput(Number(e.target.value))}
        />
        <div className="mt-2 flex items-center justify-between text-[0.6rem] font-bold text-slate-500">
          <span>Drag to mix slime colors</span>
          <span
            className="inline-flex h-5 w-5 rounded-full border border-white shadow"
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
    <div ref={wrapRef} className="relative z-[80]">
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
        <span className="inline-block animate-bounce" aria-hidden>
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
