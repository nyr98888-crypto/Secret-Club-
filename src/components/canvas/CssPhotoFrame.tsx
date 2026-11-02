"use client";

import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { readFileAsDataUrl, sanitizePhotoSrc } from "@/lib/photoDataUrl";

/** Pure-CSS scrapbook photo frame shells */
export type CssFrameArchetype =
  | "polaroid"
  | "pink_polaroid"
  | "film_strip"
  | "gold_mirror"
  | "doodle"
  | "stamp"
  | "whipped_cream"
  | "y2k_gel"
  | "holo_sleeve"
  /** Legacy */
  | "toploader"
  | "square_washi"
  | "heart_mask";

export const CSS_FRAME_ARCHETYPES: {
  id: CssFrameArchetype;
  label: string;
  emoji: string;
}[] = [
  { id: "polaroid", label: "Classic Polaroid", emoji: "📷" },
  { id: "pink_polaroid", label: "Rose Heart Polaroid", emoji: "💗" },
  { id: "whipped_cream", label: "Y2K Translucent Deco", emoji: "🧁" },
  { id: "film_strip", label: "Retro Film Strip", emoji: "🎞️" },
  { id: "gold_mirror", label: "Glitter Gold Foil", emoji: "✨" },
  { id: "stamp", label: "Scalloped Stamp", emoji: "✉️" },
  { id: "doodle", label: "Doodle Scrap", emoji: "✏️" },
  { id: "holo_sleeve", label: "Cyber Chrome Glass", emoji: "🪩" },
];

/** Map legacy SVG-era presets onto CSS archetypes */
export function resolveCssFrame(
  preset?: string | null,
): CssFrameArchetype {
  switch (preset) {
    case "polaroid":
    case "classic-polaroid":
      return "polaroid";
    case "pink_polaroid":
    case "heart_mask":
      return "pink_polaroid";
    case "film_strip":
      return "film_strip";
    case "toploader":
    case "deco-toploader":
      return "film_strip";
    case "square_washi":
    case "mini-snapshot":
      return "square_washi";
    case "doodle":
      return "doodle";
    case "stamp":
      return "stamp";
    case "gold_mirror":
      return "gold_mirror";
    case "whipped_cream":
      return "whipped_cream";
    case "y2k_gel":
      return "y2k_gel";
    case "holo_sleeve":
      return "holo_sleeve";
    default:
      return "polaroid";
  }
}

type CssPhotoFrameProps = {
  archetype?: CssFrameArchetype | string;
  photoSrc?: string | null;
  photoOffsetX?: number;
  photoOffsetY?: number;
  caption?: string;
  alt?: string;
  className?: string;
  adjusting?: boolean;
  onRequestAdjust?: () => void;
  onEndAdjust?: () => void;
  onPhotoChange?: (src: string) => void;
  onPhotoOffsetChange?: (x: number, y: number) => void;
  replaceTriggerRef?: MutableRefObject<(() => void) | null>;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function PhotoAperture({
  photoSrc,
  photoOffsetX,
  photoOffsetY,
  alt,
  adjusting,
  className,
  heartMask,
  onRequestAdjust,
  onEndAdjust,
  onPhotoChange,
  onPhotoOffsetChange,
  replaceTriggerRef,
}: {
  photoSrc?: string | null;
  photoOffsetX: number;
  photoOffsetY: number;
  alt: string;
  adjusting: boolean;
  className: string;
  heartMask?: boolean;
  onRequestAdjust?: () => void;
  onEndAdjust?: () => void;
  onPhotoChange?: (src: string) => void;
  onPhotoOffsetChange?: (x: number, y: number) => void;
  /** When set, parent can call this to open the replace picker */
  replaceTriggerRef?: MutableRefObject<(() => void) | null>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const pickerLockRef = useRef(false);
  const panStartRef = useRef<{
    x: number;
    y: number;
    ox: number;
    oy: number;
  } | null>(null);
  const [localAdjusting, setLocalAdjusting] = useState(false);
  const isAdjusting = adjusting || localAdjusting;
  const safePhotoSrc = sanitizePhotoSrc(photoSrc);
  const hasPhoto = Boolean(safePhotoSrc);

  function openPhotoPicker() {
    if (pickerLockRef.current) return;
    pickerLockRef.current = true;
    const input = fileRef.current;
    if (input) {
      // Temporarily enable so a programmatic click works even after a photo exists
      input.disabled = false;
      input.value = "";
      input.click();
    }
    window.setTimeout(() => {
      pickerLockRef.current = false;
      if (fileRef.current && hasPhoto) {
        fileRef.current.disabled = true;
      }
    }, 900);
  }

  useEffect(() => {
    if (!replaceTriggerRef) return;
    // Explicit replace only — never auto-open on frame touch/drag
    replaceTriggerRef.current = () => openPhotoPicker();
    return () => {
      replaceTriggerRef.current = null;
    };
  });

  useEffect(() => {
    const input = fileRef.current;
    if (!input) return;
    // Once filled, keep the file input disabled so accidental taps never re-open the picker
    input.disabled = hasPhoto;
  }, [hasPhoto]);

  useEffect(() => {
    if (!isAdjusting) return;
    function onDocPointerDown(e: PointerEvent) {
      const slot = slotRef.current;
      if (slot && e.target instanceof Node && slot.contains(e.target)) return;
      setLocalAdjusting(false);
      onEndAdjust?.();
    }
    window.addEventListener("pointerdown", onDocPointerDown);
    return () => window.removeEventListener("pointerdown", onDocPointerDown);
  }, [isAdjusting, onEndAdjust]);

  function onPhotoPointerDown(e: React.PointerEvent) {
    if (!hasPhoto) return;
    const now = Date.now();
    const isDouble = now - lastTapRef.current < 320;
    lastTapRef.current = now;

    // Double-tap enters crop/adjust — otherwise let parent handle select/drag
    if (isDouble) {
      e.preventDefault();
      e.stopPropagation();
      setLocalAdjusting(true);
      onRequestAdjust?.();
      return;
    }
    if (!isAdjusting) {
      // Do NOT open file picker; allow selection/transform
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: photoOffsetX,
      oy: photoOffsetY,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onPhotoPointerMove(e: React.PointerEvent) {
    if (!panStartRef.current || !isAdjusting) return;
    const slot = slotRef.current;
    if (!slot) return;
    const rect = slot.getBoundingClientRect();
    const dx = ((e.clientX - panStartRef.current.x) / rect.width) * 100;
    const dy = ((e.clientY - panStartRef.current.y) / rect.height) * 100;
    onPhotoOffsetChange?.(
      clamp(panStartRef.current.ox + dx, -35, 35),
      clamp(panStartRef.current.oy + dy, -35, 35),
    );
  }

  return (
    <div
      ref={slotRef}
      className={`relative overflow-hidden rounded-[inherit] ${className} ${
        isAdjusting ? "ring-2 ring-pink-400 ring-offset-1" : ""
      }`}
      style={
        heartMask
          ? {
              WebkitMaskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='black' d='M50 92 C20 68 4 48 4 30 C4 16 16 6 30 6 C40 6 47 12 50 20 C53 12 60 6 70 6 C84 6 96 16 96 30 C96 48 80 68 50 92 Z'/%3E%3C/svg%3E\")",
              maskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='black' d='M50 92 C20 68 4 48 4 30 C4 16 16 6 30 6 C40 6 47 12 50 20 C53 12 60 6 70 6 C84 6 96 16 96 30 C96 48 80 68 50 92 Z'/%3E%3C/svg%3E\")",
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
            }
          : undefined
      }
    >
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={safePhotoSrc!}
          src={safePhotoSrc!}
          alt={alt}
          draggable={false}
          onPointerDown={onPhotoPointerDown}
          onPointerMove={onPhotoPointerMove}
          onPointerUp={() => {
            panStartRef.current = null;
          }}
          onPointerCancel={() => {
            panStartRef.current = null;
          }}
          className={`pointer-events-auto h-full w-full select-none rounded-[inherit] object-cover ${
            isAdjusting ? "cursor-grab active:cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            transform: isAdjusting
              ? `translate(${photoOffsetX}%, ${photoOffsetY}%) scale(1.2)`
              : `translate(${photoOffsetX}%, ${photoOffsetY}%) scale(1.15)`,
            transformOrigin: "center center",
          }}
        />
      ) : (
        <button
          type="button"
          className="absolute inset-0 z-[1] flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 bg-pink-50/90 px-2 text-center"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openPhotoPicker();
          }}
          aria-label="Tap to add photo"
        >
          <span className="animate-bounce text-2xl" aria-hidden>
            📸
          </span>
          <span className="text-[0.65rem] font-extrabold leading-tight text-pink-500">
            Tap to add photo
          </span>
        </button>
      )}

      {isAdjusting ? (
        <span className="pointer-events-none absolute inset-x-1 bottom-1 z-10 rounded-full bg-white/90 px-2 py-0.5 text-center text-[0.55rem] font-extrabold text-pink-600 shadow">
          Adjust · tap outside
        </span>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        disabled={hasPhoto}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        tabIndex={-1}
        aria-hidden
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const file = e.target.files?.[0];
          pickerLockRef.current = false;
          if (!file) return;
          void readFileAsDataUrl(file)
            .then((dataUrl) => onPhotoChange?.(dataUrl))
            .catch((err) => console.error("Photo read failed", err));
          e.target.value = "";
        }}
      />
    </div>
  );
}

/**
 * Pure-Tailwind / CSS photo frame shells — photos stay clipped inside overflow-hidden apertures.
 */
export function CssPhotoFrame({
  archetype,
  photoSrc,
  photoOffsetX = 0,
  photoOffsetY = 0,
  caption = "besties ♡",
  alt = "Scrapbook photo",
  className = "",
  adjusting = false,
  onRequestAdjust,
  onEndAdjust,
  onPhotoChange,
  onPhotoOffsetChange,
  replaceTriggerRef,
}: CssPhotoFrameProps) {
  const kind = resolveCssFrame(archetype);
  const apertureProps = {
    photoSrc,
    photoOffsetX,
    photoOffsetY,
    alt,
    adjusting,
    onRequestAdjust,
    onEndAdjust,
    onPhotoChange,
    onPhotoOffsetChange,
    replaceTriggerRef,
  };

  if (kind === "polaroid") {
    return (
      <div
        className={`relative mx-auto aspect-[3/4] w-full max-w-[280px] rotate-[-2deg] rounded-sm bg-[#fffaf7] p-[8%] pb-[22%] shadow-[0_12px_28px_rgba(74,43,69,0.18)] ring-1 ring-black/5 ${className}`}
        data-frame="polaroid"
      >
        <PhotoAperture
          {...apertureProps}
          className="relative h-full w-full rounded-[2px] bg-pink-50"
        />
        <p className="pointer-events-none absolute inset-x-[8%] bottom-[6%] truncate text-center font-[var(--font-toy),cursive] text-[0.7rem] font-bold tracking-wide text-pink-400/90">
          {caption}
        </p>
      </div>
    );
  }

  if (kind === "pink_polaroid") {
    return (
      <div
        className={`relative mx-auto aspect-[3/4] w-full max-w-[280px] rotate-[1.5deg] rounded-sm p-[8%] pb-[22%] ${className}`}
        data-frame="pink_polaroid"
        style={{
          backgroundImage: "linear-gradient(180deg, #ffe4e6 0%, #fdf2f8 100%)",
          backgroundColor: "#fff1f2",
          boxShadow:
            "0 12px 28px rgba(244,114,182,0.22), 0 0 0 2px rgba(254,205,211,0.8)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-2 text-sm drop-shadow"
        >
          💕
        </span>
        <PhotoAperture
          {...apertureProps}
          className="relative h-full w-full rounded-[2px] bg-[#fff1f2]"
        />
        <p
          className="pointer-events-none absolute inset-x-[8%] bottom-[6%] truncate text-center font-[var(--font-toy),cursive] text-[0.7rem] font-bold tracking-wide"
          style={{ color: "rgba(251, 113, 133, 0.9)" }}
        >
          {caption}
        </p>
      </div>
    );
  }

  if (kind === "square_washi") {
    return (
      <div
        className={`relative mx-auto aspect-square w-full max-w-[280px] ${className}`}
        data-frame="square_washi"
      >
        <div className="relative h-full w-full overflow-hidden rounded-md bg-[#faf7f2] p-[10%] shadow-[0_10px_22px_rgba(74,43,69,0.16)] ring-1 ring-stone-300/70">
          <PhotoAperture
            {...apertureProps}
            className="relative h-full w-full rounded-sm bg-pink-50"
          />
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute -left-1 -top-2 z-10 h-5 w-14 -rotate-12 rounded-sm bg-[repeating-linear-gradient(90deg,#fda4af_0_6px,#fecdd3_6px_12px,#fff_12px_14px)] opacity-95 shadow-sm"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-1 -top-2 z-10 h-5 w-14 rotate-12 rounded-sm bg-[repeating-linear-gradient(-45deg,#c4b5fd_0_5px,#ddd6fe_5px_10px,#fff_10px_12px)] opacity-95 shadow-sm"
        />
      </div>
    );
  }

  if (kind === "doodle" || kind === "heart_mask") {
    return (
      <div
        className={`relative mx-auto aspect-square w-full max-w-[280px] ${className}`}
        data-frame="doodle"
      >
        <div
          className="relative h-full w-full bg-[#fffaf7] p-[11%] shadow-[0_10px_22px_rgba(74,43,69,0.16)]"
          style={{
            borderRadius: "18% 22% 16% 24% / 20% 16% 24% 18%",
            boxShadow:
              "0 0 0 3px #fda4af, 0 0 0 6px #c4b5fd, 0 10px 22px rgba(74,43,69,0.16)",
          }}
        >
          <PhotoAperture
            {...apertureProps}
            className="relative h-full w-full rounded-sm bg-pink-50"
          />
        </div>
        {["-left-1 -top-1", "-right-1 -top-0.5", "-left-0.5 -bottom-1", "-right-1 -bottom-0.5"].map(
          (pos, i) => (
            <span
              key={pos}
              aria-hidden
              className={`pointer-events-none absolute ${pos} z-10 text-sm ${i % 2 ? "text-violet-400" : "text-pink-400"}`}
            >
              ♡
            </span>
          ),
        )}
      </div>
    );
  }

  if (kind === "stamp") {
    return (
      <div
        className={`relative mx-auto aspect-[4/5] w-full max-w-[280px] bg-white p-[9%] shadow-[0_10px_22px_rgba(74,43,69,0.16)] ${className}`}
        data-frame="stamp"
        style={{
          // Scalloped postage-stamp edge via radial mask
          WebkitMaskImage:
            "radial-gradient(circle at 8px 8px, #000 7px, transparent 8px), linear-gradient(#000,#000)",
          WebkitMaskSize: "16px 16px, calc(100% - 16px) calc(100% - 16px)",
          WebkitMaskPosition: "-8px -8px, 8px 8px",
          WebkitMaskRepeat: "repeat, no-repeat",
          maskImage:
            "radial-gradient(circle at 8px 8px, #000 7px, transparent 8px), linear-gradient(#000,#000)",
          maskSize: "16px 16px, calc(100% - 16px) calc(100% - 16px)",
          maskPosition: "-8px -8px, 8px 8px",
          maskRepeat: "repeat, no-repeat",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      >
        <div className="h-full w-full border border-dashed border-pink-200/80 p-1">
          <PhotoAperture
            {...apertureProps}
            className="relative h-full w-full bg-pink-50"
          />
        </div>
      </div>
    );
  }

  if (kind === "whipped_cream") {
    return (
      <div
        className={`relative mx-auto aspect-[3/4] w-full max-w-[280px] ${className}`}
        data-frame="whipped_cream"
      >
        <div
          className="relative h-full w-full overflow-hidden bg-white/55 p-[12%] shadow-[0_12px_28px_rgba(255,182,193,0.35)] backdrop-blur-[2px] ring-1 ring-white/80"
          style={{
            borderRadius: "28% 32% 30% 34% / 34% 28% 36% 30%",
            boxShadow:
              "0 0 0 4px rgba(255,255,255,0.85), 0 0 0 8px rgba(251,207,232,0.55), 0 12px 28px rgba(244,114,182,0.22)",
          }}
        >
          <PhotoAperture
            {...apertureProps}
            className="relative h-full w-full rounded-[1rem] bg-pink-50/80"
          />
        </div>
        <span aria-hidden className="pointer-events-none absolute -left-1 top-3 text-lg opacity-90">
          🫧
        </span>
        <span aria-hidden className="pointer-events-none absolute -right-1 bottom-6 text-base opacity-90">
          🧁
        </span>
      </div>
    );
  }

  if (kind === "y2k_gel") {
    return (
      <div
        className={`relative mx-auto aspect-[3/4] w-full max-w-[280px] rounded-2xl p-[4%] shadow-[0_14px_32px_rgba(125,211,252,0.35)] ${className}`}
        data-frame="y2k_gel"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(244,114,182,0.55), rgba(167,139,250,0.55), rgba(34,211,238,0.55), rgba(250,204,21,0.45))",
          backgroundSize: "200% 200%",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="h-full w-full rounded-xl bg-white/35 p-[4%] shadow-inner ring-1 ring-white/60 backdrop-blur-[1px]">
          <PhotoAperture
            {...apertureProps}
            className="relative h-full w-full rounded-lg bg-fuchsia-50/70"
          />
        </div>
      </div>
    );
  }

  if (kind === "film_strip") {
    return (
      <div
        className={`relative mx-auto aspect-[3/4] w-full max-w-[280px] bg-zinc-900 p-[6%] pb-[10%] shadow-[0_12px_28px_rgba(0,0,0,0.35)] ${className}`}
        data-frame="film_strip"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent 0 10%,
              rgba(255,255,255,0.12) 10% 14%,
              transparent 14% 24%
            )
          `,
          backgroundSize: "100% 8%",
          backgroundPosition: "0 0, 0 100%",
          backgroundRepeat: "repeat-x",
        }}
      >
        <div className="absolute inset-x-0 top-0 flex h-[8%] justify-around px-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={`t${i}`} className="h-full w-[10%] rounded-sm bg-zinc-950/80" />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex h-[8%] justify-around px-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={`b${i}`} className="h-full w-[10%] rounded-sm bg-zinc-950/80" />
          ))}
        </div>
        <div className="relative mt-[8%] h-[76%] w-full overflow-hidden rounded-sm bg-zinc-800 p-1">
          <PhotoAperture
            {...apertureProps}
            className="relative h-full w-full bg-zinc-700"
          />
        </div>
      </div>
    );
  }

  if (kind === "holo_sleeve") {
    return (
      <div
        className={`relative mx-auto aspect-[3/4] w-full max-w-[280px] rounded-xl p-[5%] shadow-[0_14px_30px_rgba(192,132,252,0.4)] ${className}`}
        data-frame="holo_sleeve"
        style={{
          backgroundImage:
            "linear-gradient(120deg, #f9a8d4, #c4b5fd, #7dd3fc, #fde68a, #f9a8d4)",
          backgroundSize: "300% 300%",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="h-full w-full rounded-lg bg-white/90 p-[4%] shadow-inner ring-1 ring-white/70">
          <PhotoAperture
            {...apertureProps}
            className="relative h-full w-full rounded-md bg-violet-50"
          />
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.8) 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.7) 0 1.5px, transparent 2px)",
            backgroundSize: "40px 40px, 28px 28px",
          }}
        />
      </div>
    );
  }

  // gold_mirror — thin glitter foil border (longhands only — no `background` shorthand)
  return (
    <div
      className={`relative mx-auto aspect-[3/4] w-full max-w-[280px] rounded-lg p-[3.5%] shadow-[0_14px_30px_rgba(180,120,40,0.35)] ${className}`}
      data-frame="gold_mirror"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #fde68a, #f59e0b, #fef3c7, #d97706, #fde68a)",
        backgroundSize: "200% 200%",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="h-full w-full rounded-md bg-white p-[3%] shadow-inner">
        <PhotoAperture
          {...apertureProps}
          className="relative h-full w-full rounded-sm bg-pink-50"
        />
      </div>
    </div>
  );
}

type FrameShellPickerProps = {
  value: CssFrameArchetype | string;
  onChange: (next: CssFrameArchetype) => void;
  className?: string;
};

/** Compact icon row to swap a selected photo's CSS frame shell */
export function FrameShellPicker({
  value,
  onChange,
  className = "",
}: FrameShellPickerProps) {
  const active = resolveCssFrame(value);
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-pink-200 bg-white/95 p-1.5 shadow-md ${className}`}
      role="listbox"
      aria-label="Choose photo frame"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {CSS_FRAME_ARCHETYPES.map((f) => {
        const selected = active === f.id;
        return (
          <button
            key={f.id}
            type="button"
            role="option"
            aria-selected={selected}
            title={f.label}
            onClick={(e) => {
              e.stopPropagation();
              onChange(f.id);
            }}
            className={`grid h-9 w-9 place-items-center rounded-xl text-base transition active:scale-95 ${
              selected
                ? "bg-pink-500 text-white shadow-sm ring-2 ring-pink-300"
                : "bg-pink-50 text-pink-700 hover:bg-pink-100"
            }`}
          >
            <span aria-hidden>{f.emoji}</span>
            <span className="sr-only">{f.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default CssPhotoFrame;
