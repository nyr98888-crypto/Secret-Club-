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
import type { SecretNoteAuthor, SecretNoteData } from "./SecretNote";
import { AssetDrawer, type SheetSnap } from "./AssetDrawer";
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
import { DESELECT_EVENT } from "@/lib/exportPage";
import type { LocalMember } from "@/lib/localClub";
import { useDeviceLayout } from "@/hooks/useDeviceLayout";
import { useVaultAccess } from "@/hooks/useVaultAccess";

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

const SHEET_GATE_HEADLINE =
  "You've filled your first 5 pages! 💖 Unlock up to 50 sheets & 250+ bonus stickers in the Bestie Vault for $4.99.";

type ScrapbookCanvasProps = {
  spreads: ScrapbookSpread[];
  members?: LocalMember[];
  className?: string;
  initialSpread?: number;
  author?: SecretNoteAuthor;
  enableAssetDrawer?: boolean;
  onRequestVip?: (reason?: string) => void;
  onSpreadsChange?: (spreads: ScrapbookSpread[]) => void;
};

export function ScrapbookCanvas({
  spreads,
  members = [],
  className = "",
  initialSpread = 0,
  author,
  enableAssetDrawer = true,
  onRequestVip,
  onSpreadsChange,
}: ScrapbookCanvasProps) {
  const [localSpreads, setLocalSpreads] = useState(spreads);
  const { mode, isPortrait, isLandscapeBook } = useDeviceLayout();
  const { canUseSheet, isVip } = useVaultAccess();
  const [sheetSlide, setSheetSlide] = useState<"next" | "prev" | null>(null);
  const [pokeOpen, setPokeOpen] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<"left" | "right">("left");
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("collapsed");
  const [, setUndoStack] = useState<ScrapbookSpread[][]>([]);
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

  /** Export / print clears selection so handles never appear in the PNG */
  useEffect(() => {
    function onDeselect() {
      setSelectedElementId(null);
      setSheetSnap("collapsed");
    }
    window.addEventListener(DESELECT_EVENT, onDeselect);
    return () => window.removeEventListener(DESELECT_EVENT, onDeselect);
  }, []);

  /** Never notify VaultPage during ScrapbookCanvas render — only via effect */
  useEffect(() => {
    if (pendingPersistRef.current == null) return;
    const payload = pendingPersistRef.current;
    pendingPersistRef.current = null;
    onSpreadsChangeRef.current?.(payload);
  }, [persistNonce]);

  const patchSpreads = useCallback(
    (updater: (prev: ScrapbookSpread[]) => ScrapbookSpread[]) => {
      const prev = localSpreadsRef.current;
      const next = updater(prev);
      setUndoStack((stack) => [...stack.slice(-19), prev]);
      localSpreadsRef.current = next;
      setLocalSpreads(next);
      pendingPersistRef.current = next;
      setPersistNonce((n) => n + 1);
    },
    [],
  );

  const undoLast = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const prev = stack[stack.length - 1];
      localSpreadsRef.current = prev;
      setLocalSpreads(prev);
      pendingPersistRef.current = prev;
      setPersistNonce((n) => n + 1);
      setSelectedElementId(null);
      return stack.slice(0, -1);
    });
  }, []);

  const current = localSpreads[spreadIndex];

  const goToSpread = useCallback(
    (next: number, direction?: FlipDirection) => {
      if (totalSpreads === 0 || flip) return;
      const clamped = Math.min(Math.max(next, 0), totalSpreads - 1);
      if (clamped === spreadIndex) return;
      setSelectedElementId(null);
      setSheetSnap("collapsed");

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
      const fromName = author?.codeName || "You";
      placeOnActiveSide((spawn) =>
        createPlacedPoke(poke, spawn, fromName),
      );
    },
    [author?.codeName, placeOnActiveSide],
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
        rotation: 0,
        width: 18,
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
      const nextSide = ratio < 0.5 ? "left" : "right";
      const page = spreadIndex * 2 + (nextSide === "left" ? 1 : 2);
      if (!canUseSheet(page)) {
        onRequestVip?.(SHEET_GATE_HEADLINE);
        return;
      }
      setActiveSide(nextSide);
    },
    [canUseSheet, onRequestVip, spreadIndex],
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
      if (isPortrait) goNextPage();
      else goNextSpreadGated();
    } else {
      setSheetSlide("prev");
      if (activeSide === "right") setActiveSide("left");
      else goPrevSpread();
    }
  };

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

  const totalPages = totalSpreads * 2;
  const pageNumber =
    spreadIndex * 2 + (activeSide === "left" ? 1 : 2);

  const goPrevPage = useCallback(() => {
    setSheetSlide("prev");
    if (activeSide === "right") setActiveSide("left");
    else goPrevSpread();
  }, [activeSide, goPrevSpread]);

  const goNextPage = useCallback(() => {
    // Free tier: sheets 1–5; tapping past sheet 5 opens Bestie Vault
    const currentPage = spreadIndex * 2 + (activeSide === "left" ? 1 : 2);
    const nextPage = currentPage + 1;
    if (!canUseSheet(nextPage)) {
      onRequestVip?.(SHEET_GATE_HEADLINE);
      return;
    }
    setSheetSlide("next");
    if (activeSide === "left") setActiveSide("right");
    else goNextSpread();
  }, [activeSide, canUseSheet, goNextSpread, onRequestVip, spreadIndex]);

  const goNextSpreadGated = useCallback(() => {
    // Next spread's pages — block once both would exceed free sheet cap
    const nextLeftPage = (spreadIndex + 1) * 2 + 1;
    const nextRightPage = (spreadIndex + 1) * 2 + 2;
    if (!canUseSheet(nextRightPage) && !canUseSheet(nextLeftPage)) {
      onRequestVip?.(SHEET_GATE_HEADLINE);
      return;
    }
    if (!canUseSheet(nextLeftPage)) {
      onRequestVip?.(SHEET_GATE_HEADLINE);
      return;
    }
    goNextSpread();
  }, [canUseSheet, goNextSpread, onRequestVip, spreadIndex]);

  useEffect(() => {
    if (!sheetSlide) return;
    const t = window.setTimeout(() => setSheetSlide(null), 300);
    return () => window.clearTimeout(t);
  }, [sheetSlide, pageNumber]);

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
    <div
      className={`sheet-navigator-pill pointer-events-auto flex items-center gap-1 rounded-full shadow-sm ${
        isLandscapeBook
          ? "border border-pink-100 bg-white/90 px-4 py-1.5"
          : "bg-white px-1.5 py-1 shadow-[0_6px_18px_rgba(45,12,30,0.2)]"
      }`}
      style={isLandscapeBook ? undefined : { border: "2px solid #2D0C1E" }}
      role="navigation"
      aria-label={isPortrait ? "Sheet navigator" : "Spread navigator"}
    >
      <button
        type="button"
        onClick={isPortrait ? goPrevPage : goPrevSpread}
        disabled={
          Boolean(flip) ||
          (isPortrait ? pageNumber <= 1 : spreadIndex === 0)
        }
        className={`flex items-center justify-center rounded-full transition active:scale-95 disabled:opacity-30 ${
          isLandscapeBook
            ? "h-8 w-8 text-sm font-bold text-pink-500 hover:text-pink-700"
            : "h-11 w-11 min-h-[44px] min-w-[44px] text-lg font-black text-[#2D0C1E] hover:bg-[#2D0C1E]/10"
        }`}
        aria-label={isPortrait ? "Previous page" : "Previous spread"}
      >
        ◀
      </button>
      <span
        className={`select-none leading-none tracking-wide ${
          isLandscapeBook
            ? "px-1 text-xs font-bold text-gray-700"
            : "px-2.5 text-base font-black text-[#2D0C1E]"
        }`}
      >
        {isPortrait
          ? `Sheet ${pageNumber} of ${totalPages}`
          : `Spread ${spreadIndex + 1} of ${totalSpreads}`}
      </span>
      <button
        type="button"
        onClick={isPortrait ? goNextPage : goNextSpreadGated}
        disabled={
          Boolean(flip) ||
          (isPortrait
            ? pageNumber >= totalPages
            : spreadIndex >= totalSpreads - 1)
        }
        className={`flex items-center justify-center rounded-full transition active:scale-95 disabled:opacity-30 ${
          isLandscapeBook
            ? "h-8 w-8 text-sm font-bold text-pink-500 hover:text-pink-700"
            : "h-11 w-11 min-h-[44px] min-w-[44px] text-lg font-black text-[#2D0C1E] hover:bg-[#2D0C1E]/10"
        }`}
        aria-label={isPortrait ? "Next page" : "Next spread"}
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
          setSheetSnap("collapsed");
        }}
        onChange={(patch) => {
          const next = toContinuous ? toContinuous(patch, el) : patch;
          onUpdateElement(el.id, next);
        }}
        onDelete={() => onDeleteElement(el.id)}
        onRequestVip={onRequestVip}
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
      className={`vault-canvas-root relative flex min-h-0 max-h-full w-full max-w-full flex-1 overflow-hidden overflow-x-hidden ${
        isLandscapeBook ? "flex-row items-stretch" : "flex-col"
      } ${className}`}
    >
      {/* 1. Main stage — book stays centered in remaining space */}
      <div
        className={`vault-canvas-stage relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
          isLandscapeBook
            ? "items-center justify-center p-6"
            : "items-center justify-center pb-[7.5rem] pt-2 md:pb-24 md:pt-3 lg:pb-28"
        }`}
        data-viewport-mode={mode}
      >
        {isLandscapeBook ? (
          <>
            <div className="mb-3 flex w-full max-w-[860px] shrink-0 items-center justify-between px-2">
              <PageClaimTab
                variant="inline"
                side="left"
                claim={leftAuthor}
                members={members}
                onClaim={(c) => setClaim("left", c)}
              />
              {spreadNav}
              <PageClaimTab
                variant="inline"
                side="right"
                claim={rightAuthor}
                members={members}
                onClaim={(c) => setClaim("right", c)}
              />
            </div>

            <div
              ref={canvasRef}
              data-print-root
              className="scrapbook-canvas scrapbook-canvas-surface relative flex aspect-[1.4/1] h-auto max-h-[75vh] w-full max-w-[860px] overflow-hidden rounded-3xl border-4 border-pink-100 bg-white shadow-2xl transition-all duration-300"
              style={{
                perspective: 1400,
                touchAction: "none",
                backgroundColor: "#ffffff",
              }}
              onPointerDown={(e) => {
                if (
                  e.target !== e.currentTarget &&
                  !(e.target as HTMLElement).dataset?.pageSide
                ) {
                  return;
                }
                setSelectedElementId(null);
                setSheetSnap("collapsed");
                setActiveSideFromPointer(e.clientX, canvasRef.current);
              }}
            >
              <div
                role="button"
                tabIndex={0}
                data-page-side="left"
                aria-label="Left page"
                aria-pressed={activeSide === "left"}
                className={`scrapbook-page-half relative flex h-full w-1/2 select-none flex-col overflow-hidden rounded-l-[1.25rem] p-4 transition-colors duration-200 ${
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
                  setSheetSnap("collapsed");
                }}
              >
                <div
                  className="relative m-2 flex-1 rounded-2xl border-2 border-dashed"
                  style={{ borderColor: "rgba(251, 207, 232, 0.6)" }}
                />
              </div>

              <div
                aria-hidden
                className="pointer-events-none z-10 flex h-full w-6 shrink-0 flex-col items-center justify-around py-4"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-2 w-4 rounded-full border border-gray-300 bg-gray-200 shadow-inner"
                  />
                ))}
              </div>

              <div
                role="button"
                tabIndex={0}
                data-page-side="right"
                aria-label="Right page"
                aria-pressed={activeSide === "right"}
                className={`scrapbook-page-half relative flex h-full w-1/2 select-none flex-col overflow-hidden rounded-r-[1.25rem] p-4 transition-colors duration-200 ${
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
                  setSheetSnap("collapsed");
                }}
              >
                <div
                  className="relative m-2 flex-1 rounded-2xl border-2 border-dashed"
                  style={{ borderColor: "rgba(251, 207, 232, 0.6)" }}
                />
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-1/2 z-[19] w-5 -translate-x-1/2"
                style={{
                  backgroundImage:
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
          </>
        ) : (
          /* —— Portrait: craft clipboard / single artboard —— */
          <div className="relative flex h-full max-h-full min-h-0 w-full max-w-full flex-col items-center justify-center overflow-hidden p-3">
            <div className="relative flex min-h-0 w-full max-w-full flex-1 flex-col items-center justify-center overflow-hidden pt-2 md:pt-3">
              <PageClaimTab
                side={activeSide}
                claim={activeSide === "left" ? leftAuthor : rightAuthor}
                members={members}
                onClaim={(c) => setClaim(activeSide, c)}
              />

              <div
                className="craft-clipboard-board relative mx-auto flex max-w-full flex-col items-center"
                data-clipboard-mode={mode}
                style={{ perspective: 1200 }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <div className="sheet-nav-row relative z-30 mb-1 flex w-full max-w-[inherit] shrink-0 items-center justify-center">
                  {spreadNav}
                </div>

                <div
                  className="craft-clipboard-clasp relative z-20 mb-[-0.4rem] mt-0.5 flex h-4 w-[38%] max-w-[8rem] items-center justify-center rounded-md md:h-5 md:max-w-[9rem]"
                  aria-hidden
                >
                  <span className="h-2 w-2 rounded-full bg-zinc-500/80 shadow-inner ring-1 ring-white/50 md:h-2.5 md:w-2.5" />
                </div>

                <div
                  ref={mobileCanvasRef}
                  data-print-root
                  key={`${spreadIndex}-${activeSide}`}
                  className={`scrapbook-canvas scrapbook-canvas-surface craft-clipboard-sheet relative z-10 mx-auto
                    rounded-[1.25rem] p-3 transition-colors duration-200 md:rounded-[1.5rem] md:p-5
                    ${
                      mode === "mobile-portrait"
                        ? "overflow-visible"
                        : "overflow-hidden"
                    }
                    ${sheetSlide === "next" ? "sheet-slide-next" : ""}
                    ${sheetSlide === "prev" ? "sheet-slide-prev" : ""}`}
                  style={{
                    ...pagePaper,
                    touchAction: "none",
                    border: "2px solid #2D0C1E",
                  }}
                  onPointerDown={() => {
                    setSelectedElementId(null);
                    setSheetSnap("collapsed");
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
            </div>
          </div>
        )}
      </div>

      {/* 2. Desktop right sidebar OR portrait bottom dock */}
      {enableAssetDrawer ? (
        <AssetDrawer
          onPlaceAsset={placeAsset}
          onRequestPoke={() => {
            setSheetSnap("peek");
            setPokeOpen(true);
          }}
          onRequestVip={onRequestVip}
          onAddSnap={placeSnap}
          onUndo={undoLast}
          paperId={current.paperId}
          onSelectPaper={setPaper}
          sheetSnap={sheetSnap}
          onSheetSnapChange={setSheetSnap}
        />
      ) : null}

      <SweetPokeModal
        open={pokeOpen}
        onClose={() => setPokeOpen(false)}
        onStickPoke={stickPoke}
        isVip={isVip}
        onRequestVip={onRequestVip}
      />
    </div>
  );
}

export default ScrapbookCanvas;
