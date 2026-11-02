"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FramePreset, PlacedElementData } from "@/lib/scrapbookAssets";
import { WashiStrip } from "./WashiStrip";
import { SoundCharmStamp } from "./SoundCharmStamp";
import {
  CssPhotoFrame,
  type CssFrameArchetype,
} from "./canvas/CssPhotoFrame";
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
};

type DragMode = "move" | "scale" | "rotate" | null;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizeDeg(deg: number) {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/**
 * Interactive scrapbook item — kid-obvious handles when selected:
 * ✖ delete (top-right), 🔄 rotate (top-center), ⤢ scale (bottom-right).
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
  } | null>(null);
  const replaceTriggerRef = useRef<(() => void) | null>(null);
  const [dragging, setDragging] = useState(false);
  const [adjustingPhoto, setAdjustingPhoto] = useState(false);

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
  const hasPhoto = Boolean(element.photoSrc);

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
      if (modeRef.current === "move") {
        const { x, y } = clientToPercent(e.clientX, e.clientY);
        onChange({ x, y });
      } else if (
        (modeRef.current === "scale" || modeRef.current === "rotate") &&
        transformStartRef.current
      ) {
        const t = transformStartRef.current;
        if (modeRef.current === "scale") {
          const dist = Math.hypot(e.clientX - t.centerX, e.clientY - t.centerY);
          const ratio = t.startDist > 4 ? dist / t.startDist : 1;
          onChange({ scale: clamp(t.scale * ratio, 0.5, 2.5) });
        } else {
          const angle =
            (Math.atan2(e.clientY - t.centerY, e.clientX - t.centerX) * 180) /
            Math.PI;
          const delta = angle - t.startPointerAngle;
          onChange({ rotation: normalizeDeg(t.rotation + delta) });
        }
      }
    }

    function onPointerUp() {
      modeRef.current = null;
      transformStartRef.current = null;
      setDragging(false);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [clientToPercent, dragging, onChange]);

  function startMove(e: React.PointerEvent) {
    if (adjustingPhoto) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    modeRef.current = "move";
    setDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function beginTransform(e: React.PointerEvent, mode: "scale" | "rotate") {
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
    modeRef.current = mode;
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

  const handleUpright = { transform: `rotate(${-element.rotation}deg)` };

  return (
    <div
      ref={rootRef}
      className={`pointer-events-auto absolute z-[6] touch-none select-none ${
        selected || adjustingPhoto ? "z-50" : ""
      }`}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${displayWidth}%`,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
      }}
      onPointerDown={startMove}
      role="button"
      tabIndex={0}
      aria-label={`${element.label}. Drag to move.`}
      aria-pressed={selected}
    >
      <div
        className={`group relative rounded-2xl transition ${
          selected
            ? "outline outline-2 outline-pink-300/70 outline-offset-2"
            : ""
        }`}
      >
        {pokeCharm ? (
          <div className="relative w-full" onPointerDown={startMove}>
            <SoundCharmStamp
              poke={pokeCharm}
              charmId={element.id}
              fromName={element.fromName || "You"}
              burstOnMount
            />
          </div>
        ) : isWashi && element.washiPatternId ? (
          <div className="relative w-full py-1" onPointerDown={startMove}>
            <WashiStrip patternId={element.washiPatternId} label={element.label} />
          </div>
        ) : element.emoji && !isFrame ? (
          <div
            className="grid aspect-square w-full place-items-center drop-shadow-[0_6px_10px_rgba(74,43,69,0.18)]"
            onPointerDown={startMove}
          >
            <span className="pointer-events-none text-[clamp(1.6rem,8vw,3rem)] leading-none">
              {element.emoji}
            </span>
          </div>
        ) : isFrame ? (
          <div className="relative" onPointerDown={startMove}>
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
                onChange({ photoSrc: src, photoOffsetX: 0, photoOffsetY: 0 });
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

        {showControls ? (
          <>
            {/* Top-right: delete */}
            <button
              type="button"
              data-print-hide="true"
              className="export-ignore no-export print-hide absolute -right-3 -top-3 z-50 grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-full
                border-2 border-white bg-[#ff4d6d] text-base font-black text-white shadow-lg"
              style={handleUpright}
              aria-label={`Delete ${element.label}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              ✖
            </button>

            {/* Top-center: rotate */}
            <button
              type="button"
              data-print-hide="true"
              className="export-ignore no-export print-hide absolute -top-3 left-1/2 z-50 grid h-11 w-11 min-h-[44px] min-w-[44px] -translate-x-1/2 cursor-grab place-items-center
                rounded-full border-2 border-violet-200 bg-[#e9d5ff] text-lg shadow-lg active:cursor-grabbing"
              style={handleUpright}
              aria-label={`Rotate ${element.label}`}
              title="Drag to rotate"
              onPointerDown={(e) => beginTransform(e, "rotate")}
            >
              🔄
            </button>

            {/* Bottom-right: scale */}
            <button
              type="button"
              data-print-hide="true"
              className="export-ignore no-export print-hide absolute -bottom-3 -right-3 z-50 grid h-11 w-11 min-h-[44px] min-w-[44px] cursor-nwse-resize place-items-center
                rounded-full border-2 border-amber-200 bg-[#fef08a] text-lg shadow-lg active:cursor-grabbing"
              style={handleUpright}
              aria-label={`Resize ${element.label}`}
              title="Drag to resize"
              onPointerDown={(e) => beginTransform(e, "scale")}
            >
              ⤢
            </button>

            {isFrame ? (
              <button
                type="button"
                data-print-hide="true"
                className="export-ignore no-export print-hide absolute -bottom-3 -left-3 z-50 grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center
                  rounded-full border-2 border-violet-200 bg-violet-50 text-sm shadow-lg"
                style={handleUpright}
                aria-label={hasPhoto ? "Replace photo" : "Add photo"}
                title={hasPhoto ? "Replace photo" : "Add photo"}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  replaceTriggerRef.current?.();
                }}
              >
                ✏️
              </button>
            ) : null}

            {isFrame && selected ? (
              <div
                data-print-hide="true"
                className="export-ignore no-export print-hide absolute left-1/2 top-full z-30 mt-2 flex -translate-x-1/2 gap-1"
                style={handleUpright}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {(
                  [
                    "polaroid",
                    "pink_polaroid",
                    "whipped_cream",
                    "film_strip",
                    "gold_mirror",
                    "stamp",
                    "doodle",
                    "holo_sleeve",
                  ] as CssFrameArchetype[]
                ).map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`grid h-8 w-8 place-items-center rounded-lg text-xs ${
                      (element.framePreset ?? "polaroid") === id
                        ? "bg-pink-500 text-white"
                        : "bg-white/95 text-pink-600 shadow"
                    }`}
                    aria-label={`Frame ${id}`}
                    onClick={() =>
                      onChange({ framePreset: id as FramePreset })
                    }
                  >
                    {id === "polaroid"
                      ? "📷"
                      : id === "pink_polaroid"
                        ? "💗"
                        : id === "whipped_cream"
                          ? "🧁"
                          : id === "film_strip"
                            ? "🎞️"
                            : id === "gold_mirror"
                              ? "✨"
                              : id === "stamp"
                                ? "✉️"
                                : id === "doodle"
                                  ? "✏️"
                                  : "🪩"}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
