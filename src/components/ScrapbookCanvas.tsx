"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  SecretNote,
  type SecretNoteAuthor,
  type SecretNoteData,
} from "./SecretNote";
import { AssetDrawer } from "./AssetDrawer";
import { PlacedCanvasElement } from "./PlacedCanvasElement";
import { SweetPokeModal, type SweetPoke } from "./SweetPokeModal";
import { PageClaimTab } from "./PageClaimTab";
import {
  SpreadPageFlip,
  type FlipDirection,
} from "./SpreadPageFlip";
import {
  createPlacedElement,
  createPlacedPoke,
  type DrawerAsset,
  type PlacedElementData,
} from "@/lib/scrapbookAssets";
import {
  FramedPhotoCard,
  type FramePreset,
  type FramedPhotoCardProps,
} from "./FramedPhotoCard";
import {
  spawnOnSide,
  type PageClaim,
  type ScrapbookSpread,
} from "@/lib/scrapbookStore";
import { getPaperSwatch, paperStyle, type PaperId } from "@/lib/paperPalette";
import { ensureAudio, playPageTurn } from "@/lib/audio";
import type { LocalMember } from "@/lib/localClub";

export type FramedPhotoProps = {
  photoSrc?: string | null;
  frameSrc?: string;
  preset?: FramePreset;
  alt?: string;
  className?: string;
  rotation?: number;
  photoOffsetX?: number;
  photoOffsetY?: number;
  onPhotoChange?: (src: string) => void;
  onPhotoOffsetChange?: (x: number, y: number) => void;
};

/** @deprecated Prefer FramedPhotoCard */
export function FramedPhoto({
  photoSrc,
  frameSrc = "/frames/classic_polaroid.svg",
  preset = "classic-polaroid",
  alt = "Scrapbook photo",
  className = "",
  rotation = 0,
  photoOffsetX,
  photoOffsetY,
  onPhotoChange,
  onPhotoOffsetChange,
}: FramedPhotoProps) {
  return (
    <div
      className={`relative inline-block w-full ${className}`}
      style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
    >
      <FramedPhotoCard
        frameSrc={frameSrc}
        preset={preset}
        photoSrc={photoSrc}
        photoOffsetX={photoOffsetX}
        photoOffsetY={photoOffsetY}
        alt={alt}
        onPhotoChange={onPhotoChange}
        onPhotoOffsetChange={onPhotoOffsetChange}
      />
    </div>
  );
}

export type { FramePreset, FramedPhotoCardProps };

/** Legacy page shape — still exported for older helpers */
export type ScrapbookPageData = {
  id: string;
  backgroundSrc: string;
  photos?: FramedPhotoProps[];
  notes?: SecretNoteData[];
  elements?: PlacedElementData[];
  children?: ReactNode;
};

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

type ScrapbookCanvasProps = {
  spreads: ScrapbookSpread[];
  members?: LocalMember[];
  className?: string;
  initialSpread?: number;
  author?: SecretNoteAuthor;
  enableAssetDrawer?: boolean;
  onRequestVip?: () => void;
  onSpreadsChange?: (spreads: ScrapbookSpread[]) => void;
};

export function ScrapbookCanvas({
  spreads,
  members = [],
  className = "",
  initialSpread = 0,
  enableAssetDrawer = true,
  onRequestVip,
  onSpreadsChange,
}: ScrapbookCanvasProps) {
  const [localSpreads, setLocalSpreads] = useState(spreads);
  const [pokeOpen, setPokeOpen] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<"left" | "right">("left");
  const [sheetCollapsed, setSheetCollapsed] = useState(true);
  const [flip, setFlip] = useState<FlipDirection | null>(null);
  const pendingIndexRef = useRef<number | null>(null);
  const totalSpreads = localSpreads.length;
  const [spreadIndex, setSpreadIndex] = useState(() =>
    Math.min(Math.max(initialSpread, 0), Math.max(totalSpreads - 1, 0)),
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  const mobileCanvasRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const skipSwipeRef = useRef(false);
  const localSpreadsRef = useRef(localSpreads);
  const onSpreadsChangeRef = useRef(onSpreadsChange);
  const pendingPersistRef = useRef<ScrapbookSpread[] | null>(null);
  const [persistNonce, setPersistNonce] = useState(0);
  localSpreadsRef.current = localSpreads;
  onSpreadsChangeRef.current = onSpreadsChange;

  useEffect(() => {
    setLocalSpreads(spreads);
    localSpreadsRef.current = spreads;
  }, [spreads]);

  useEffect(() => {
    setSpreadIndex((i) => Math.min(i, Math.max(totalSpreads - 1, 0)));
  }, [totalSpreads]);

  /** Never notify VaultPage during ScrapbookCanvas render — only via effect */
  useEffect(() => {
    if (pendingPersistRef.current == null) return;
    const payload = pendingPersistRef.current;
    pendingPersistRef.current = null;
    onSpreadsChangeRef.current?.(payload);
  }, [persistNonce]);

  const patchSpreads = useCallback(
    (updater: (prev: ScrapbookSpread[]) => ScrapbookSpread[]) => {
      const next = updater(localSpreadsRef.current);
      localSpreadsRef.current = next;
      setLocalSpreads(next);
      pendingPersistRef.current = next;
      setPersistNonce((n) => n + 1);
    },
    [],
  );

  const current = localSpreads[spreadIndex];

  const goToSpread = useCallback(
    (next: number, direction?: FlipDirection) => {
      if (totalSpreads === 0 || flip) return;
      const clamped = Math.min(Math.max(next, 0), totalSpreads - 1);
      if (clamped === spreadIndex) return;
      setSelectedElementId(null);
      setSheetCollapsed(true);

      const dir =
        direction ?? (clamped > spreadIndex ? "next" : "prev");
      pendingIndexRef.current = clamped;
      void ensureAudio().then(() => playPageTurn());
      setFlip(dir);
    },
    [flip, spreadIndex, totalSpreads],
  );

  const finishFlip = useCallback(() => {
    if (pendingIndexRef.current != null) {
      setSpreadIndex(pendingIndexRef.current);
      pendingIndexRef.current = null;
    }
    setFlip(null);
  }, []);

  const goPrevSpread = useCallback(
    () => goToSpread(spreadIndex - 1, "prev"),
    [goToSpread, spreadIndex],
  );
  const goNextSpread = useCallback(
    () => goToSpread(spreadIndex + 1, "next"),
    [goToSpread, spreadIndex],
  );

  const updateSpreadElements = useCallback(
    (updater: (els: PlacedElementData[]) => PlacedElementData[]) => {
      patchSpreads((prev) =>
        prev.map((s, i) =>
          i === spreadIndex ? { ...s, elements: updater(s.elements ?? []) } : s,
        ),
      );
    },
    [patchSpreads, spreadIndex],
  );

  const placeOnActiveSide = useCallback(
    (factory: (spawn: { x: number; y: number }) => PlacedElementData) => {
      const spawn = spawnOnSide(activeSide);
      const placed = factory(spawn);
      setSelectedElementId(placed.id);
      updateSpreadElements((els) => [...els, placed]);
    },
    [activeSide, updateSpreadElements],
  );

  const placeAsset = useCallback(
    (asset: DrawerAsset) => {
      placeOnActiveSide((spawn) => createPlacedElement(asset, spawn));
    },
    [placeOnActiveSide],
  );

  const stickPoke = useCallback(
    (poke: SweetPoke) => {
      placeOnActiveSide((spawn) => createPlacedPoke(poke, spawn));
    },
    [placeOnActiveSide],
  );

  const placeSnap = useCallback(
    (photoSrc: string) => {
      placeOnActiveSide((spawn) => ({
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `snap-${Date.now()}`,
        assetId: "snap-polaroid",
        category: "frames",
        src: "",
        label: "My Snap",
        x: spawn.x,
        y: spawn.y,
        rotation: Math.random() * 8 - 4,
        width: 22,
        scale: 1,
        photoSrc,
        photoOffsetX: 0,
        photoOffsetY: 0,
        framePreset: "polaroid",
      }));
    },
    [placeOnActiveSide],
  );

  const onUpdateElement = useCallback(
    (elementId: string, patch: ElementPatch) => {
      updateSpreadElements((els) =>
        els.map((el) => (el.id === elementId ? { ...el, ...patch } : el)),
      );
    },
    [updateSpreadElements],
  );

  const onDeleteElement = useCallback(
    (elementId: string) => {
      setSelectedElementId((id) => (id === elementId ? null : id));
      updateSpreadElements((els) => els.filter((el) => el.id !== elementId));
    },
    [updateSpreadElements],
  );

  const setClaim = useCallback(
    (side: "left" | "right", claim: PageClaim) => {
      patchSpreads((prev) =>
        prev.map((s, i) => {
          if (i !== spreadIndex) return s;
          if (side === "left") {
            return { ...s, leftPageAuthor: claim, leftClaim: claim };
          }
          return { ...s, rightPageAuthor: claim, rightClaim: claim };
        }),
      );
    },
    [patchSpreads, spreadIndex],
  );

  const setPaper = useCallback(
    (paperId: PaperId) => {
      const swatch = getPaperSwatch(paperId);
      patchSpreads((prev) =>
        prev.map((s, i) =>
          i === spreadIndex
            ? {
                ...s,
                paperId,
                backgroundColor: swatch.backgroundColor,
                texturePattern: swatch.texturePattern,
              }
            : s,
        ),
      );
    },
    [patchSpreads, spreadIndex],
  );

  const leftAuthor = current?.leftPageAuthor ?? current?.leftClaim ?? null;
  const rightAuthor = current?.rightPageAuthor ?? current?.rightClaim ?? null;

  const setActiveSideFromPointer = useCallback(
    (clientX: number, target: HTMLElement | null) => {
      if (!target) return;
      const rect = target.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = (clientX - rect.left) / rect.width;
      setActiveSide(ratio < 0.5 ? "left" : "right");
    },
    [],
  );

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
    skipSwipeRef.current = selectedElementId != null;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (skipSwipeRef.current || touchStartX.current == null) {
      touchStartX.current = null;
      return;
    }
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) {
      if (activeSide === "left") setActiveSide("right");
      else goNextSpread();
    } else {
      if (activeSide === "right") setActiveSide("left");
      else goPrevSpread();
    }
  };

  const [spreadHost, setSpreadHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const resolve = () => {
      setSpreadHost(document.getElementById("header-spread-slot"));
    };
    resolve();
    // Header may mount a tick later on unlock / shelf transitions
    const t = window.setTimeout(resolve, 0);
    return () => window.clearTimeout(t);
  }, []);

  const mobileElements = useMemo(() => {
    if (!current) return [];
    return (current.elements ?? [])
      .filter((el) =>
        activeSide === "left" ? el.x < 50 : el.x >= 50,
      )
      .map((el) => ({
        ...el,
        // Remap continuous coords into single-page 0–100
        x: activeSide === "left" ? el.x * 2 : (el.x - 50) * 2,
      }));
  }, [activeSide, current]);

  if (totalSpreads === 0 || !current) {
    return (
      <div
        className={`rounded-2xl border-2 border-dashed border-pink-200 bg-white/60 p-8 text-center text-sm text-[var(--muted)] ${className}`}
      >
        No scrapbook spreads yet.
      </div>
    );
  }

  const spreadNav = (
    <div className="flex items-center gap-2 rounded-full border border-pink-200 bg-white/90 px-3 py-1.5 shadow-sm">
      <button
        type="button"
        onClick={goPrevSpread}
        disabled={spreadIndex === 0 || Boolean(flip)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-pink-700 font-bold hover:bg-pink-200 active:scale-95 disabled:opacity-30"
        aria-label="Previous spread"
      >
        ◀
      </button>
      <span className="select-none px-2 text-xs font-black tracking-wide text-slate-700">
        Spread {spreadIndex + 1} of {totalSpreads}
      </span>
      <button
        type="button"
        onClick={goNextSpread}
        disabled={spreadIndex >= totalSpreads - 1 || Boolean(flip)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-pink-700 font-bold hover:bg-pink-200 active:scale-95 disabled:opacity-30"
        aria-label="Next spread"
      >
        ▶
      </button>
    </div>
  );

  function renderElements(
    elements: PlacedElementData[],
    ref: React.RefObject<HTMLElement | null>,
    /** When remapping mobile, write back to continuous coords */
    toContinuous?: (patch: ElementPatch, el: PlacedElementData) => ElementPatch,
  ) {
    return elements.map((el) => (
      <PlacedCanvasElement
        key={el.id}
        element={el}
        canvasRef={ref}
        selected={selectedElementId === el.id}
        onSelect={() => {
          setSelectedElementId(el.id);
          setSheetCollapsed(true);
        }}
        onChange={(patch) => {
          const next = toContinuous ? toContinuous(patch, el) : patch;
          onUpdateElement(el.id, next);
        }}
        onDelete={() => onDeleteElement(el.id)}
      />
    ));
  }

  const pagePaper = paperStyle({
    paperId: current.paperId,
    backgroundColor: current.backgroundColor || "#ffffff",
    texturePattern: current.texturePattern,
  });
  const activeGlow = (side: "left" | "right") =>
    activeSide === side
      ? "inset 0 0 0 3px rgba(244,114,182,0.55), inset 0 0 28px rgba(251,207,232,0.45)"
      : undefined;

  return (
    <div
      className={`relative flex min-h-0 w-full flex-1 flex-col ${className}`}
    >
      {spreadHost ? createPortal(spreadNav, spreadHost) : null}

      {/* Center book — hero canvas; room for right tray on md+ */}
      <div className="flex h-[calc(100vh-4.5rem)] min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden p-6 pb-20 md:p-10 md:pb-10 md:pr-80 xl:pr-[22rem]">
        {/* —— Desktop: unified continuous spread canvas —— */}
        <div className="relative mx-auto hidden h-full w-full max-w-5xl flex-col items-center justify-center md:flex xl:max-w-6xl">
          {!spreadHost ? (
            <div className="mb-3 flex justify-center">{spreadNav}</div>
          ) : null}

          <div className="relative w-full pt-5">
            <PageClaimTab
              side="left"
              claim={leftAuthor}
              members={members}
              onClaim={(c) => setClaim("left", c)}
            />
            <PageClaimTab
              side="right"
              claim={rightAuthor}
              members={members}
              onClaim={(c) => setClaim("right", c)}
            />

            <div
              ref={canvasRef}
              className="relative flex h-[82vh] max-h-[820px] w-full overflow-visible rounded-[2.5rem] border-[6px] border-pink-100 bg-white shadow-2xl transition-all duration-300"
              style={{ perspective: 1400 }}
              onPointerDown={(e) => {
                if (
                  e.target !== e.currentTarget &&
                  !(e.target as HTMLElement).dataset?.pageSide
                ) {
                  return;
                }
                setSelectedElementId(null);
                setSheetCollapsed(true);
                setActiveSideFromPointer(e.clientX, canvasRef.current);
              }}
            >
              <div
                role="button"
                tabIndex={0}
                data-page-side="left"
                aria-label="Left page"
                aria-pressed={activeSide === "left"}
                className={`relative flex h-full w-1/2 select-none flex-col overflow-hidden rounded-l-[2rem] p-6 transition-colors duration-200 ${
                  activeSide === "left" ? "z-[1]" : ""
                }`}
                style={{
                  ...pagePaper,
                  boxShadow: activeGlow("left"),
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setActiveSide("left");
                  setSelectedElementId(null);
                  setSheetCollapsed(true);
                }}
              >
                <div className="relative m-2 flex-1 rounded-2xl border-2 border-dashed border-pink-200/60" />
              </div>

              <div
                role="button"
                tabIndex={0}
                data-page-side="right"
                aria-label="Right page"
                aria-pressed={activeSide === "right"}
                className={`relative flex h-full w-1/2 select-none flex-col overflow-hidden rounded-r-[2rem] p-6 transition-colors duration-200 ${
                  activeSide === "right" ? "z-[1]" : ""
                }`}
                style={{
                  ...pagePaper,
                  boxShadow: activeGlow("right"),
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setActiveSide("right");
                  setSelectedElementId(null);
                  setSheetCollapsed(true);
                }}
              >
                <div className="relative m-2 flex-1 rounded-2xl border-2 border-dashed border-pink-200/60" />
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 z-20 flex h-full w-8 -translate-x-1/2 flex-col justify-around py-6"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className="mx-auto h-3.5 w-3.5 rounded-full border-2 border-rose-200 bg-gradient-to-b from-white to-pink-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12),0_1px_2px_rgba(244,114,182,0.35)]"
                  />
                ))}
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-1/2 z-[19] w-5 -translate-x-1/2"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(40,18,36,0.12) 0%, rgba(255,255,255,0.45) 50%, rgba(40,18,36,0.12) 100%)",
                }}
              />

              <div className="pointer-events-none absolute inset-0 z-[8] overflow-visible">
                {renderElements(current.elements ?? [], canvasRef)}
              </div>

              {flip ? (
                <SpreadPageFlip
                  direction={flip}
                  faceStyle={pagePaper}
                  onComplete={finishFlip}
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* —— Mobile: one active side at a time —— */}
        <div className="relative w-full md:hidden">
          {!spreadHost ? <div className="mb-3">{spreadNav}</div> : null}
          <div className="relative pt-4">
            <PageClaimTab
              side={activeSide}
              claim={activeSide === "left" ? leftAuthor : rightAuthor}
              members={members}
              onClaim={(c) => setClaim(activeSide, c)}
            />
            <div
              className="relative rounded-2xl bg-[#2a1824] p-2 shadow-[0_18px_40px_rgba(74,43,69,0.25)]"
              style={{ perspective: 1200 }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div
                ref={mobileCanvasRef}
                className="relative min-h-[420px] overflow-visible rounded-xl p-4 transition-colors duration-200"
                style={pagePaper}
                onPointerDown={() => {
                  setSelectedElementId(null);
                  setSheetCollapsed(true);
                }}
              >
                {renderElements(mobileElements, mobileCanvasRef, (patch) => {
                  const out: ElementPatch = { ...patch };
                  if (typeof patch.x === "number") {
                    out.x =
                      activeSide === "left"
                        ? patch.x / 2
                        : 50 + patch.x / 2;
                  }
                  return out;
                })}
                {flip ? (
                  <SpreadPageFlip
                    direction={flip}
                    faceStyle={pagePaper}
                    onComplete={finishFlip}
                  />
                ) : null}
              </div>
            </div>
            <div className="mt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSide("left")}
                className={`rounded-full px-3 py-2 text-xs font-extrabold ${
                  activeSide === "left"
                    ? "bg-pink-500 text-white"
                    : "bg-pink-50 text-pink-600"
                }`}
              >
                Left page
              </button>
              <button
                type="button"
                onClick={() => setActiveSide("right")}
                className={`rounded-full px-3 py-2 text-xs font-extrabold ${
                  activeSide === "right"
                    ? "bg-pink-500 text-white"
                    : "bg-pink-50 text-pink-600"
                }`}
              >
                Right page
              </button>
            </div>
          </div>
        </div>
      </div>

      {enableAssetDrawer ? (
        <AssetDrawer
          onPlaceAsset={placeAsset}
          onRequestPoke={() => {
            setSheetCollapsed(false);
            setPokeOpen(true);
          }}
          onRequestVip={onRequestVip}
          onAddSnap={placeSnap}
          paperId={current.paperId}
          onSelectPaper={setPaper}
          collapsed={sheetCollapsed}
          onCollapsedChange={setSheetCollapsed}
        />
      ) : null}

      <SweetPokeModal
        open={pokeOpen}
        onClose={() => setPokeOpen(false)}
        onStickPoke={stickPoke}
      />
    </div>
  );
}

export default ScrapbookCanvas;
