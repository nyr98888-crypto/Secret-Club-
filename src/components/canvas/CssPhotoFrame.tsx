"use client";

import { useEffect, useRef, useState } from "react";

/** Pure-CSS scrapbook photo frame shells */
export type CssFrameArchetype =
  | "polaroid"
  | "toploader"
  | "square_washi"
  | "heart_mask"
  | "stamp"
  | "gold_mirror";

export const CSS_FRAME_ARCHETYPES: {
  id: CssFrameArchetype;
  label: string;
  emoji: string;
}[] = [
  { id: "polaroid", label: "Polaroid", emoji: "📷" },
  { id: "toploader", label: "Toploader", emoji: "💎" },
  { id: "square_washi", label: "Washi", emoji: "🎀" },
  { id: "heart_mask", label: "Heart", emoji: "💕" },
  { id: "stamp", label: "Stamp", emoji: "✉️" },
  { id: "gold_mirror", label: "Gold", emoji: "✨" },
];

/** Map legacy SVG-era presets onto CSS archetypes */
export function resolveCssFrame(
  preset?: string | null,
): CssFrameArchetype {
  switch (preset) {
    case "polaroid":
    case "classic-polaroid":
      return "polaroid";
    case "toploader":
    case "deco-toploader":
      return "toploader";
    case "square_washi":
    case "mini-snapshot":
      return "square_washi";
    case "heart_mask":
      return "heart_mask";
    case "stamp":
      return "stamp";
    case "gold_mirror":
      return "gold_mirror";
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
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const panStartRef = useRef<{
    x: number;
    y: number;
    ox: number;
    oy: number;
  } | null>(null);
  const [localAdjusting, setLocalAdjusting] = useState(false);
  const isAdjusting = adjusting || localAdjusting;

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
    e.stopPropagation();
    const now = Date.now();
    const isDouble = now - lastTapRef.current < 320;
    lastTapRef.current = now;
    if (!photoSrc) return;
    if (isDouble) {
      e.preventDefault();
      setLocalAdjusting(true);
      onRequestAdjust?.();
      return;
    }
    if (!isAdjusting) return;
    e.preventDefault();
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
      className={`overflow-hidden ${className} ${
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
      {photoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoSrc}
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
          className={`h-full w-full select-none object-cover ${
            isAdjusting
              ? "cursor-grab active:cursor-grabbing"
              : ""
          }`}
          style={{
            transform: `translate(${photoOffsetX}%, ${photoOffsetY}%) scale(1.2)`,
            transformOrigin: "center center",
          }}
        />
      ) : (
        <button
          type="button"
          className="absolute inset-0 z-[1] flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 bg-pink-50/90 px-2 text-center"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            fileRef.current?.click();
          }}
          aria-label="Tap to add photo"
        >
          <span className="animate-bounce text-2xl" aria-hidden>
            📸
          </span>
          <span className="text-[0.65rem] font-extrabold leading-tight text-pink-500">
            Tap to Add
          </span>
        </button>
      )}

      {isAdjusting ? (
        <span className="pointer-events-none absolute inset-x-1 bottom-1 rounded-full bg-white/90 px-2 py-0.5 text-center text-[0.55rem] font-extrabold text-pink-600 shadow">
          Adjust · tap outside
        </span>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onPhotoChange?.(URL.createObjectURL(file));
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
  };

  if (kind === "polaroid") {
    return (
      <div
        className={`relative aspect-[3/4] w-full rotate-[-2deg] rounded-sm bg-[#fffaf7] p-[8%] pb-[22%] shadow-[0_12px_28px_rgba(74,43,69,0.18)] ring-1 ring-black/5 ${className}`}
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

  if (kind === "toploader") {
    return (
      <div
        className={`relative aspect-[3/4] w-full rounded-2xl border-2 border-pink-200 bg-white/50 p-3 shadow-lg backdrop-blur-sm ${className}`}
        data-frame="toploader"
      >
        <PhotoAperture
          {...apertureProps}
          className="relative h-full w-full rounded-xl bg-pink-50/80"
        />
        {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"].map(
          (pos) => (
            <span
              key={pos}
              aria-hidden
              className={`pointer-events-none absolute ${pos} z-10 h-3 w-3 rounded-full bg-gradient-to-br from-pink-200 via-fuchsia-300 to-violet-300 shadow-[0_0_6px_rgba(244,114,182,0.7)] ring-1 ring-white/80`}
            />
          ),
        )}
      </div>
    );
  }

  if (kind === "square_washi") {
    return (
      <div
        className={`relative aspect-square w-full ${className}`}
        data-frame="square_washi"
      >
        <div className="relative h-full w-full overflow-hidden rounded-md bg-[#faf7f2] p-[10%] shadow-[0_10px_22px_rgba(74,43,69,0.16)] ring-1 ring-stone-300/70">
          <PhotoAperture
            {...apertureProps}
            className="relative h-full w-full rounded-sm bg-pink-50"
          />
        </div>
        {/* Washi strips — top corners */}
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

  if (kind === "heart_mask") {
    return (
      <div
        className={`relative aspect-square w-full rounded-[1.5rem] bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100 p-3 shadow-[0_12px_26px_rgba(244,114,182,0.25)] ${className}`}
        data-frame="heart_mask"
      >
        <PhotoAperture
          {...apertureProps}
          heartMask
          className="relative h-full w-full bg-pink-100"
        />
      </div>
    );
  }

  if (kind === "stamp") {
    return (
      <div
        className={`relative aspect-[4/5] w-full bg-white p-[9%] shadow-[0_10px_22px_rgba(74,43,69,0.16)] ${className}`}
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

  // gold_mirror
  return (
    <div
      className={`relative aspect-[3/4] w-full rounded-xl bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 p-[7%] shadow-[0_14px_30px_rgba(180,120,40,0.35)] ${className}`}
      data-frame="gold_mirror"
    >
      <div className="h-full w-full rounded-lg bg-gradient-to-br from-amber-100/80 to-yellow-50/60 p-[4%] shadow-inner">
        <PhotoAperture
          {...apertureProps}
          className="relative h-full w-full rounded-md bg-pink-50 ring-1 ring-amber-300/50"
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
