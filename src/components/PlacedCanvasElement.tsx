"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FramePreset, PlacedElementData } from "@/lib/scrapbookAssets";
import { FoldedSecretNote } from "./FoldedSecretNote";
import {
  CssPhotoFrame,
  FrameShellPicker,
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

/** Normalize degrees into [-180, 180] */
function normalizeDeg(deg: number) {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/**
 * Interactive scrapbook item — move, resize (0.5–2.5×), rotate / straighten.
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
  const scaleStartRef = useRef<{
    scale: number;
    centerX: number;
    centerY: number;
    startDist: number;
  } | null>(null);
  const rotateStartRef = useRef<{
    centerX: number;
    centerY: number;
    startPointerAngle: number;
    startRotation: number;
  } | null>(null);
  const lastTapRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [adjustingPhoto, setAdjustingPhoto] = useState(false);

  const isFrame = element.category === "frames";
  const isPoke = element.category === "pokes" && Boolean(element.emoji);
  const scale = element.scale ?? 1;
  const displayWidth = element.width * scale;
  const showControls = (selected || dragging) && !adjustingPhoto;

  const pokeCharm: SweetPoke | null = isPoke
    ? {
        id: element.assetId.replace(/^poke-/, ""),
        icon: element.emoji!,
        title: element.label,
        soundType: element.soundType ?? "pop",
        sealColor: element.sealColor ?? "from-pink-400 to-rose-400",
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
      } else if (modeRef.current === "scale" && scaleStartRef.current) {
        const s = scaleStartRef.current;
        const dist = Math.hypot(e.clientX - s.centerX, e.clientY - s.centerY);
        const ratio = s.startDist > 4 ? dist / s.startDist : 1;
        onChange({ scale: clamp(s.scale * ratio, 0.5, 2.5) });
      } else if (modeRef.current === "rotate" && rotateStartRef.current) {
        const r = rotateStartRef.current;
        const angle =
          (Math.atan2(e.clientY - r.centerY, e.clientX - r.centerX) * 180) /
          Math.PI;
        const delta = angle - r.startPointerAngle;
        onChange({
          rotation: normalizeDeg(r.startRotation + delta),
        });
      }
    }

    function onPointerUp() {
      modeRef.current = null;
      scaleStartRef.current = null;
      rotateStartRef.current = null;
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

  function startScale(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    const root = rootRef.current;
    const rect = root?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : e.clientX;
    const centerY = rect ? rect.top + rect.height / 2 : e.clientY;
    const startDist =
      Math.hypot(e.clientX - centerX, e.clientY - centerY) || 40;
    modeRef.current = "scale";
    scaleStartRef.current = { scale, centerX, centerY, startDist };
    setDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function startRotate(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    onSelect();

    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      // Double-tap → straighten
      lastTapRef.current = 0;
      onChange({ rotation: 0 });
      return;
    }
    lastTapRef.current = now;

    const root = rootRef.current;
    const rect = root?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : e.clientX;
    const centerY = rect ? rect.top + rect.height / 2 : e.clientY;
    const startPointerAngle =
      (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
    modeRef.current = "rotate";
    rotateStartRef.current = {
      centerX,
      centerY,
      startPointerAngle,
      startRotation: element.rotation ?? 0,
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
        selected || adjustingPhoto ? "z-[12]" : ""
      }`}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${displayWidth}%`,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
      }}
      onPointerDown={isPoke || isFrame ? undefined : startMove}
      role="button"
      tabIndex={0}
      aria-label={`${element.label}. Drag to move, resize, or rotate.`}
      aria-pressed={selected}
    >
      <div
        className={`group relative rounded-2xl transition ${
          selected
            ? "outline outline-2 outline-dashed outline-pink-300/90 outline-offset-4"
            : "hover:outline hover:outline-2 hover:outline-dashed hover:outline-pink-200/70 hover:outline-offset-2"
        }`}
      >
        {pokeCharm ? (
          <div className="relative w-full">
            <FoldedSecretNote poke={pokeCharm} />
            <button
              type="button"
              aria-label={`Move ${element.label}`}
              className={`absolute -left-3 -top-3 z-20 grid min-h-[48px] min-w-[48px] place-items-center rounded-full
                border-2 border-pink-200 bg-white text-base shadow-md ${
                  showControls ? "opacity-100" : "opacity-80"
                }`}
              style={handleUpright}
              onPointerDown={startMove}
            >
              ✥
            </button>
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
          <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
            <CssPhotoFrame
              archetype={element.framePreset ?? "polaroid"}
              photoSrc={element.photoSrc}
              photoOffsetX={element.photoOffsetX ?? 0}
              photoOffsetY={element.photoOffsetY ?? 0}
              caption={element.label}
              adjusting={adjustingPhoto}
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
            {selected && !adjustingPhoto ? (
              <div
                className="absolute left-1/2 top-full z-30 mt-2 w-max -translate-x-1/2"
                style={handleUpright}
              >
                <FrameShellPicker
                  value={element.framePreset ?? "polaroid"}
                  onChange={(next: CssFrameArchetype) =>
                    onChange({ framePreset: next as FramePreset })
                  }
                />
              </div>
            ) : null}
            <button
              type="button"
              aria-label={`Move ${element.label}`}
              className={`absolute -left-3 -top-3 z-20 grid min-h-[48px] min-w-[48px] place-items-center rounded-full
                border-2 border-pink-200 bg-white text-base shadow-md ${
                  showControls || selected ? "opacity-100" : "opacity-80"
                }`}
              style={handleUpright}
              onPointerDown={startMove}
            >
              ✥
            </button>
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

        <button
          type="button"
          aria-label={`Delete ${element.label}`}
          className={`absolute -right-3 -top-3 z-20 grid min-h-[48px] min-w-[48px] place-items-center rounded-full
            border-2 border-white bg-[#ff4d6d] text-lg font-black text-white shadow-md transition ${
              showControls
                ? "opacity-100 scale-100"
                : "pointer-events-none opacity-0 scale-90"
            }`}
          style={handleUpright}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          ✖
        </button>

        {showControls ? (
          <>
            <button
              type="button"
              aria-label={`Rotate ${element.label}. Double-tap to straighten.`}
              title="Drag to rotate · double-tap to straighten"
              className="absolute -top-3 left-1/2 z-20 grid min-h-[48px] min-w-[48px] -translate-x-1/2 cursor-grab place-items-center
                rounded-full border-2 border-pink-300 bg-pink-50 text-lg shadow-md active:cursor-grabbing"
              style={handleUpright}
              onPointerDown={startRotate}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onChange({ rotation: 0 });
              }}
            >
              🔄
            </button>
            <button
              type="button"
              aria-label={`Resize ${element.label}`}
              className="absolute -bottom-3 -right-3 z-20 grid min-h-[48px] min-w-[48px] cursor-nwse-resize place-items-center
                rounded-full border-2 border-pink-200 bg-white text-lg font-black text-pink-500 shadow-md"
              style={handleUpright}
              onPointerDown={startScale}
            >
              ↔
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
