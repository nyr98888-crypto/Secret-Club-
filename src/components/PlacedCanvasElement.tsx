"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlacedElementData } from "@/lib/scrapbookAssets";
import { WashiStrip } from "./WashiStrip";
import { SoundCharmStamp } from "./SoundCharmStamp";
import { CssPhotoFrame } from "./canvas/CssPhotoFrame";
import type { SweetPoke } from "./SweetPokeModal";

type ElementPatch = Partial<
  Pick<
    PlacedElementData,
    | "x"
    | "y"
    | "rotation"
    | "width"
    | "scale"
    | "photoSrc"
    | "photoOffsetX"
    | "photoOffsetY"
    | "framePreset"
  >
>;

type PlacedCanvasElementProps = {
  element: PlacedElementData;
  selected: boolean;
  canvasRef: React.RefObject<HTMLElement | null>;
  onSelect: () => void;
  onChange: (patch: ElementPatch) => void;
  onDelete: () => void;
  onRequestVip?: () => void;
};

type DragMode = "move" | "corner" | "pinch" | null;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizeDeg(deg: number) {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

type TouchXY = Pick<React.Touch, "clientX" | "clientY">;

function touchDistance(a: TouchXY, b: TouchXY) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function touchAngle(a: TouchXY, b: TouchXY) {
  return (Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180) / Math.PI;
}

function touchMid(a: TouchXY, b: TouchXY) {
  return {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2,
  };
}

/**
 * Interactive scrapbook item — whole body drags; selected chrome is just
 * ✕ delete (top-right) + one resize/rotate corner (bottom-right).
 * Two-finger pinch scales; twist rotates.
 */
export function PlacedCanvasElement({
  element,
  selected,
  canvasRef,
  onSelect,
  onChange,
  onDelete,
}: PlacedCanvasElementProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<DragMode>(null);
  const transformStartRef = useRef<{
    scale: number;
    rotation: number;
    centerX: number;
    centerY: number;
    startDist: number;
    startPointerAngle: number;
    startMidX?: number;
    startMidY?: number;
    startX?: number;
    startY?: number;
  } | null>(null);
  const replaceTriggerRef = useRef<(() => void) | null>(null);
  const [dragging, setDragging] = useState(false);
  const [adjustingPhoto, setAdjustingPhoto] = useState(false);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(
    new Map(),
  );

  const isFrame = element.category === "frames";
  const isWashi = element.category === "washi" && Boolean(element.washiPatternId);
  const isPoke = element.category === "pokes" && Boolean(element.emoji);
  const scale = element.scale ?? 1;
  const legacyGiantFrame =
    isFrame &&
    (element.framePreset === "film_strip" ||
      element.framePreset === "toploader" ||
      element.framePreset === "deco-toploader" ||
      element.width > 32);
  const baseWidth = legacyGiantFrame ? Math.min(element.width, 20) : element.width;
  const displayWidth = baseWidth * scale;
  const showControls = selected && !adjustingPhoto;

  const pokeCharm: SweetPoke | null = isPoke
    ? {
        id: element.assetId.replace(/^poke-/, ""),
        icon: element.emoji!,
        title: element.label,
        soundType: element.soundType ?? "pop",
        sealColor:
          element.sealColor ??
          "linear-gradient(135deg, #f472b6 0%, #fb7185 100%)",
      }
    : null;

  const clientToPercent = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: element.x, y: element.y };
      const rect = canvas.getBoundingClientRect();
      return {
        x: clamp(((clientX - rect.left) / rect.width) * 100, 1, 99),
        y: clamp(((clientY - rect.top) / rect.height) * 100, 1, 99),
      };
    },
    [canvasRef, element.x, element.y],
  );

  useEffect(() => {
    if (!dragging) return;

    function onPointerMove(e: PointerEvent) {
      e.preventDefault();
      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, {
          x: e.clientX,
          y: e.clientY,
        });
      }

      if (modeRef.current === "move") {
        const { x, y } = clientToPercent(e.clientX, e.clientY);
        onChange({ x, y });
        return;
      }

      if (modeRef.current === "corner" && transformStartRef.current) {
        const t = transformStartRef.current;
        const dist = Math.hypot(e.clientX - t.centerX, e.clientY - t.centerY);
        const ratio = t.startDist > 4 ? dist / t.startDist : 1;
        const angle =
          (Math.atan2(e.clientY - t.centerY, e.clientX - t.centerX) * 180) /
          Math.PI;
        const delta = angle - t.startPointerAngle;
        onChange({
          scale: clamp(t.scale * ratio, 0.5, 2.5),
          rotation: normalizeDeg(t.rotation + delta),
        });
        return;
      }

      if (modeRef.current === "pinch" && transformStartRef.current) {
        const pts = [...activePointers.current.values()];
        if (pts.length < 2) return;
        const [a, b] = pts;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const angle =
          (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        const t = transformStartRef.current;
        const ratio = t.startDist > 4 ? dist / t.startDist : 1;
        const rotDelta = angle - t.startPointerAngle;
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const patch: ElementPatch = {
          scale: clamp(t.scale * ratio, 0.5, 2.5),
          rotation: normalizeDeg(t.rotation + rotDelta),
        };
        if (t.startMidX != null && t.startMidY != null && t.startX != null && t.startY != null) {
          const dx = midX - t.startMidX;
          const dy = midY - t.startMidY;
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            patch.x = clamp(t.startX + (dx / rect.width) * 100, 1, 99);
            patch.y = clamp(t.startY + (dy / rect.height) * 100, 1, 99);
          }
        }
        onChange(patch);
      }
    }

    function onPointerUp(e: PointerEvent) {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size === 0) {
        modeRef.current = null;
        transformStartRef.current = null;
        setDragging(false);
      } else if (activePointers.current.size === 1 && modeRef.current === "pinch") {
        modeRef.current = "move";
        transformStartRef.current = null;
      }
    }

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [canvasRef, clientToPercent, dragging, onChange]);

  function startMove(e: React.PointerEvent) {
    if (adjustingPhoto) return;
    const target = e.target as HTMLElement;
    // Never steal pointer from delete/resize handles or "Tap to add photo"
    if (
      target.closest("[data-handle]") ||
      target.closest("[data-photo-upload]") ||
      target.closest('input[type="file"]')
    ) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size >= 2) {
      const pts = [...activePointers.current.values()];
      const [a, b] = pts;
      modeRef.current = "pinch";
      transformStartRef.current = {
        scale,
        rotation: element.rotation ?? 0,
        centerX: (a.x + b.x) / 2,
        centerY: (a.y + b.y) / 2,
        startDist: Math.hypot(a.x - b.x, a.y - b.y) || 40,
        startPointerAngle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
        startMidX: (a.x + b.x) / 2,
        startMidY: (a.y + b.y) / 2,
        startX: element.x,
        startY: element.y,
      };
      setDragging(true);
      return;
    }

    modeRef.current = "move";
    setDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function beginCorner(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    const root = rootRef.current;
    const rect = root?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : e.clientX;
    const centerY = rect ? rect.top + rect.height / 2 : e.clientY;
    const startDist =
      Math.hypot(e.clientX - centerX, e.clientY - centerY) || 40;
    const startPointerAngle =
      (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
    modeRef.current = "corner";
    transformStartRef.current = {
      scale,
      rotation: element.rotation ?? 0,
      centerX,
      centerY,
      startDist,
      startPointerAngle,
    };
    setDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  /** Native touch fallback for two-finger pinch when pointers don't multi-track */
  function onTouchStart(e: React.TouchEvent) {
    if (adjustingPhoto || e.touches.length < 2) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    const a = e.touches[0];
    const b = e.touches[1];
    modeRef.current = "pinch";
    transformStartRef.current = {
      scale,
      rotation: element.rotation ?? 0,
      centerX: touchMid(a, b).x,
      centerY: touchMid(a, b).y,
      startDist: touchDistance(a, b) || 40,
      startPointerAngle: touchAngle(a, b),
      startMidX: touchMid(a, b).x,
      startMidY: touchMid(a, b).y,
      startX: element.x,
      startY: element.y,
    };
    setDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (modeRef.current !== "pinch" || !transformStartRef.current) return;
    if (e.touches.length < 2) return;
    e.preventDefault();
    const a = e.touches[0];
    const b = e.touches[1];
    const t = transformStartRef.current;
    const dist = touchDistance(a, b);
    const angle = touchAngle(a, b);
    const mid = touchMid(a, b);
    const ratio = t.startDist > 4 ? dist / t.startDist : 1;
    const patch: ElementPatch = {
      scale: clamp(t.scale * ratio, 0.5, 2.5),
      rotation: normalizeDeg(t.rotation + (angle - t.startPointerAngle)),
    };
    if (t.startMidX != null && t.startMidY != null && t.startX != null && t.startY != null) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        patch.x = clamp(t.startX + ((mid.x - t.startMidX) / rect.width) * 100, 1, 99);
        patch.y = clamp(t.startY + ((mid.y - t.startMidY) / rect.height) * 100, 1, 99);
      }
    }
    onChange(patch);
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (e.touches.length === 0) {
      modeRef.current = null;
      transformStartRef.current = null;
      setDragging(false);
    }
  }

  return (
    <div
      ref={rootRef}
      data-vault-preview={element.vaultPreview ? "true" : undefined}
      className={`pointer-events-auto absolute z-[6] touch-none select-none ${
        selected || adjustingPhoto ? "z-50" : ""
      }`}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${displayWidth}%`,
        transform: `translate(-50%, -50%) rotate(${element.rotation ?? 0}deg)`,
        transformOrigin: "center center",
        touchAction: "none",
      }}
      onPointerDown={startMove}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      role="button"
      tabIndex={0}
      aria-label={`${element.label}. Drag to move. Pinch to resize. Twist to rotate.`}
      aria-pressed={selected}
    >
      {/* Selection chrome lives inside the rotated root so outline + handles stay locked to the card */}
      <div
        className={`group relative box-border rounded-2xl transition ${
          selected
            ? "outline outline-2 outline-pink-400 outline-offset-2"
            : ""
        } ${element.vaultPreview ? "opacity-90" : ""}`}
      >
        {pokeCharm ? (
          <div className="relative w-full">
            <SoundCharmStamp
              poke={pokeCharm}
              charmId={element.id}
              fromName={element.fromName || "You"}
              burstOnMount
            />
          </div>
        ) : isWashi && element.washiPatternId ? (
          <div className="relative w-full py-1">
            <WashiStrip patternId={element.washiPatternId} label={element.label} />
          </div>
        ) : element.emoji && !isFrame ? (
          <div className="grid aspect-square w-full place-items-center drop-shadow-[0_6px_10px_rgba(74,43,69,0.18)]">
            <span className="pointer-events-none text-[clamp(1.6rem,8vw,3rem)] leading-none">
              {element.emoji}
            </span>
          </div>
        ) : isFrame ? (
          <div className="relative">
            <CssPhotoFrame
              archetype={element.framePreset ?? "polaroid"}
              photoSrc={element.photoSrc}
              photoOffsetX={element.photoOffsetX ?? 0}
              photoOffsetY={element.photoOffsetY ?? 0}
              caption={element.label}
              adjusting={adjustingPhoto}
              replaceTriggerRef={replaceTriggerRef}
              onRequestAdjust={() => {
                onSelect();
                setAdjustingPhoto(true);
              }}
              onEndAdjust={() => setAdjustingPhoto(false)}
              onPhotoChange={(src) => {
                onSelect();
                // Keep card upright when a photo is attached
                onChange({
                  photoSrc: src,
                  photoOffsetX: 0,
                  photoOffsetY: 0,
                  rotation: 0,
                });
              }}
              onPhotoOffsetChange={(x, y) =>
                onChange({ photoOffsetX: x, photoOffsetY: y })
              }
            />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={element.src}
            alt={element.label}
            className="pointer-events-none h-auto w-full object-contain drop-shadow-[0_6px_10px_rgba(74,43,69,0.22)]"
            draggable={false}
          />
        )}

        {element.vaultPreview && selected ? (
          <span
            data-print-hide="true"
            className="export-ignore no-export print-hide pointer-events-none absolute left-1/2 top-0 z-40 -translate-x-1/2 -translate-y-1/2
              whitespace-nowrap rounded-full border border-[#2D0C1E]/30 bg-white/95 px-2 py-0.5 text-[0.6rem] font-bold text-[#2D0C1E] shadow"
          >
            Vault Exclusive ✨
          </span>
        ) : null}

        {showControls ? (
          <>
            <button
              type="button"
              data-handle="delete"
              data-print-hide="true"
              className="export-ignore no-export print-hide absolute -right-3 -top-3 z-50 grid h-9 w-9 min-h-[36px] min-w-[36px] place-items-center rounded-full
                border-[2.5px] border-white bg-[#ff4d6d] text-base font-black leading-none text-white shadow-[0_4px_14px_rgba(74,14,46,0.35)]"
              aria-label={`Delete ${element.label}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              ✕
            </button>

            <button
              type="button"
              data-handle="corner"
              data-print-hide="true"
              className="export-ignore no-export print-hide absolute -bottom-3 -right-3 z-50 grid h-9 w-9 min-h-[36px] min-w-[36px] cursor-nwse-resize place-items-center
                rounded-full border-[2.5px] border-white bg-[#2D0C1E] text-sm text-white shadow-[0_4px_14px_rgba(74,14,46,0.28)] active:cursor-grabbing"
              aria-label={`Resize and rotate ${element.label}`}
              title="Drag to resize & rotate"
              onPointerDown={beginCorner}
            >
              ⤡
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
