"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ASSET_TABS,
  DEFAULT_DRAWER_ASSETS,
  MAGIC_CHEST_ASSET,
  stickerToDrawerAsset,
  type AssetCategory,
  type DrawerAsset,
} from "@/lib/scrapbookAssets";
import {
  STICKER_TABS,
  stickersForTab,
  type StickerTabId,
} from "@/constants/stickers";
import { PAPER_PALETTE, type PaperId } from "@/lib/paperPalette";
import { getWashiSwatch, WASHI_TORN_CLIP } from "@/lib/washiTapes";
import { AddSnapButton } from "./AddSnapButton";
import { useDeviceLayout } from "@/hooks/useDeviceLayout";
import { ensureAudio, playPop } from "@/lib/audio";
import { readFileAsDataUrl } from "@/lib/photoDataUrl";
import { useVaultAccess } from "@/hooks/useVaultAccess";

type DrawerTab = AssetCategory | "paper";
export type SheetSnap = "collapsed" | "peek" | "expanded";

type AssetDrawerProps = {
  assets?: DrawerAsset[];
  onPlaceAsset: (asset: DrawerAsset) => void;
  onRequestPoke?: () => void;
  onRequestVip?: () => void;
  onAddSnap?: (photoSrc: string) => void;
  onUndo?: () => void;
  onOpenVibes?: () => void;
  paperId?: PaperId | string;
  onSelectPaper?: (paperId: PaperId) => void;
  /** External snap control (compact layout) */
  sheetSnap?: SheetSnap;
  onSheetSnapChange?: (snap: SheetSnap) => void;
  className?: string;
};

const TABS: { id: DrawerTab; label: string }[] = [
  ...ASSET_TABS,
  { id: "paper", label: "Paper" },
];

const SNAP_HEIGHT: Record<SheetSnap, string> = {
  collapsed: "0px",
  peek: "45dvh",
  expanded: "85dvh",
};

export function AssetDrawer({
  assets = DEFAULT_DRAWER_ASSETS,
  onPlaceAsset,
  onRequestPoke,
  onRequestVip,
  onAddSnap,
  onUndo,
  onOpenVibes,
  paperId,
  onSelectPaper,
  sheetSnap: sheetSnapProp,
  onSheetSnapChange,
  className = "",
}: AssetDrawerProps) {
  const { isPortrait, isLandscapeBook } = useDeviceLayout();
  const {
    isVip,
    canUseStickerTab,
    withFreeTierApplied,
    canUsePaper,
  } = useVaultAccess();
  const compact = isPortrait;
  const [tab, setTab] = useState<DrawerTab>("stickers");
  const [stickerTab, setStickerTab] = useState<StickerTabId>("animals");
  const deferredStickerTab = useDeferredValue(stickerTab);
  const [brokenIds, setBrokenIds] = useState<Record<string, true>>({});
  const [internalSnap, setInternalSnap] = useState<SheetSnap>("collapsed");
  const snap = sheetSnapProp ?? internalSnap;
  const dragStartY = useRef<number | null>(null);
  const dragStartSnap = useRef<SheetSnap>("peek");
  const snapInputRef = useRef<HTMLInputElement>(null);

  function setSnap(next: SheetSnap) {
    onSheetSnapChange?.(next);
    if (sheetSnapProp === undefined) setInternalSnap(next);
  }

  useEffect(() => {
    if (isLandscapeBook) setSnap("collapsed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLandscapeBook]);

  const shelf = useMemo(
    () =>
      tab === "paper" || tab === "stickers"
        ? []
        : assets
            .filter((a) => a.category === tab)
            .map(withFreeTierApplied),
    [assets, tab, withFreeTierApplied],
  );

  const stickerShelf = useMemo(() => {
    if (tab !== "stickers") return [];
    return stickersForTab(deferredStickerTab)
      .map(stickerToDrawerAsset)
      .map(withFreeTierApplied)
      .filter((a) => !brokenIds[a.id]);
  }, [tab, deferredStickerTab, brokenIds, withFreeTierApplied]);

  function selectTab(next: DrawerTab) {
    if (!isVip && (next === "gems" || next === "washi" || next === "pokes")) {
      onRequestVip?.();
      if (compact && snap === "collapsed") setSnap("peek");
      return;
    }
    setTab(next);
    if (compact && snap === "collapsed") setSnap("peek");
    if (next === "pokes") onRequestPoke?.();
  }

  function selectStickerTab(next: StickerTabId) {
    if (!canUseStickerTab(next)) {
      onRequestVip?.();
      return;
    }
    startTransition(() => setStickerTab(next));
  }

  function pick(asset: DrawerAsset) {
    const gated = withFreeTierApplied(asset);
    if (gated.locked || gated.action === "open-vip") {
      onRequestVip?.();
      return;
    }
    if (asset.action === "compose-poke") {
      onRequestPoke?.();
      return;
    }
    onPlaceAsset(asset);
    // Collapse so the canvas (and new sticker) is immediately visible
    if (compact) setSnap("collapsed");
  }

  function markBroken(id: string) {
    setBrokenIds((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  }

  function openStickersSheet() {
    void ensureAudio().then(() => playPop());
    setTab("stickers");
    setSnap(snap === "collapsed" ? "peek" : snap === "peek" ? "expanded" : "peek");
  }

  function openPaperSheet() {
    void ensureAudio().then(() => playPop());
    setTab("paper");
    setSnap("peek");
    onOpenVibes?.();
  }

  const toolTabPills = (
    <div
      className="flex gap-1.5 overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar pb-0.5"
      role="tablist"
      aria-label="Asset categories"
    >
      {TABS.map((t) => {
        const active = tab === t.id;
        const lockedTab =
          !isVip && (t.id === "gems" || t.id === "washi" || t.id === "pokes");
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => selectTab(t.id)}
            className={`inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full px-3 text-[0.7rem] font-extrabold transition
              ${
                lockedTab
                  ? "border border-dashed border-amber-300 bg-amber-50 text-amber-800"
                  : active
                    ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-sm"
                    : "border border-pink-200 bg-white/90 text-slate-700 hover:border-pink-300"
              }`}
          >
            {lockedTab ? `🔒 ${t.label}` : t.label}
          </button>
        );
      })}
    </div>
  );

  const stickerCatPills =
    tab === "stickers" ? (
      <div
        className="flex gap-1.5 overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar"
        role="tablist"
        aria-label="Sticker packs"
      >
        {STICKER_TABS.map((t) => {
          const active = stickerTab === t.id;
          const lockedPack = !canUseStickerTab(t.id);
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectStickerTab(t.id)}
              className={`inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-full px-3 text-[0.65rem] font-extrabold transition
                ${
                  lockedPack
                    ? "border border-dashed border-amber-300 bg-amber-50 text-amber-800"
                    : active
                      ? "bg-pink-500 text-white shadow-sm"
                      : "border border-pink-100 bg-pink-50/80 text-pink-700 hover:border-pink-300"
                }`}
            >
              {lockedPack ? `🔒 ${t.label}` : t.label}
            </button>
          );
        })}
      </div>
    ) : null;

  function renderAssetTile(asset: DrawerAsset, opts?: { hideLabel?: boolean }) {
    if (brokenIds[asset.id]) return null;
    const hideLabel = opts?.hideLabel ?? asset.category === "stickers";
    const washi = asset.washiPatternId
      ? getWashiSwatch(asset.washiPatternId)
      : undefined;

    return (
      <button
        key={asset.id}
        type="button"
        role="option"
        aria-selected={false}
        onClick={() => pick(asset)}
        className={`group relative flex min-h-[56px] flex-col items-center justify-center rounded-xl border-2
          p-1.5 transition hover:-translate-y-1 hover:shadow-md active:scale-95 active:-translate-y-0.5
          ${
            asset.locked
              ? "border-dashed border-amber-300 bg-gradient-to-b from-amber-50 to-pink-50"
              : hideLabel
                ? "border-transparent bg-transparent hover:border-pink-200/70 hover:bg-white/50"
                : "border-[var(--stroke)] bg-white/80 hover:border-pink-300"
          }`}
        aria-label={
          asset.locked ? "Unlock the Magic Chest" : `Place ${asset.label}`
        }
      >
        <span
          className={`grid min-h-[48px] w-full place-items-center overflow-hidden transition-transform duration-200
            group-hover:scale-110 group-active:scale-95 ${hideLabel ? "py-1" : ""}`}
        >
          {washi ? (
            <span
              className="block h-6 w-14 shadow-sm"
              style={{
                ...washi.style,
                opacity: 0.92,
                clipPath: WASHI_TORN_CLIP,
                WebkitClipPath: WASHI_TORN_CLIP,
              }}
              aria-hidden
            />
          ) : asset.category === "frames" ? (
            <span
              className="grid h-11 w-9 place-items-center rounded-sm border-2 border-pink-200 bg-white text-lg shadow-sm"
              aria-hidden
            >
              {asset.emoji || "🖼️"}
            </span>
          ) : asset.emoji && !asset.src ? (
            <span className="text-2xl" aria-hidden>
              {asset.emoji}
            </span>
          ) : asset.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.src}
              alt=""
              loading="lazy"
              decoding="async"
              className="max-h-14 max-w-full object-contain drop-shadow-sm"
              draggable={false}
              onError={() => markBroken(asset.id)}
            />
          ) : (
            <span aria-hidden>✨</span>
          )}
        </span>
        {!hideLabel || asset.locked ? (
          <span className="w-full truncate text-center text-[0.55rem] font-bold text-[var(--ink)]">
            {asset.locked ? `🔒 ${asset.label}` : asset.label}
          </span>
        ) : null}
      </button>
    );
  }

  const shelfBody = (
    <>
      {tab === "paper"
        ? (
            <div className="grid grid-cols-3 gap-2 p-1 sm:grid-cols-4">
              {PAPER_PALETTE.map((swatch) => {
                const active = paperId === swatch.id;
                const lockedPaper = !canUsePaper(swatch.id);
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      if (lockedPaper) {
                        onRequestVip?.();
                        return;
                      }
                      onSelectPaper?.(swatch.id);
                      if (compact) setSnap("collapsed");
                    }}
                    className={`group relative flex min-h-[56px] flex-col items-center gap-1 rounded-2xl border-2 p-1.5 transition
                      hover:-translate-y-0.5 hover:shadow-md active:scale-95
                      ${
                        lockedPaper
                          ? "border-dashed border-amber-300 bg-amber-50/80"
                          : active
                            ? "border-pink-400 ring-2 ring-pink-300/60"
                            : "border-[var(--stroke)] bg-white/80 hover:border-pink-300"
                      }`}
                    aria-label={
                      lockedPaper
                        ? `Unlock ${swatch.label} paper`
                        : `Use ${swatch.label} paper`
                    }
                  >
                    <span
                      className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-pink-100 text-lg shadow-inner"
                      style={{
                        backgroundColor: swatch.backgroundColor,
                        backgroundImage: swatch.backgroundImage ?? "none",
                        backgroundSize: swatch.backgroundSize ?? "auto",
                        backgroundRepeat: swatch.backgroundImage
                          ? "repeat"
                          : "no-repeat",
                      }}
                      aria-hidden
                    >
                      {lockedPaper ? "🔒" : swatch.emoji}
                    </span>
                    <span className="w-full truncate text-center text-[0.55rem] font-bold leading-tight text-[var(--ink)]">
                      {lockedPaper ? `🔒 ${swatch.label}` : swatch.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )
        : tab === "pokes"
          ? (
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => onRequestPoke?.()}
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl border-2
                  border-pink-300 bg-gradient-to-r from-pink-50 to-violet-50 px-3 py-4 transition
                  hover:border-pink-400 hover:shadow-md active:scale-[0.99]"
                aria-label="Open sweet poke sound charms"
              >
                <span className="text-2xl" aria-hidden>
                  💖
                </span>
                <span className="text-left">
                  <span className="block text-sm font-extrabold text-pink-600">
                    Sound Charms
                  </span>
                  <span className="block text-[0.65rem] font-bold text-[var(--muted)]">
                    Stick a poke on the page
                  </span>
                </span>
              </button>
            )
          : tab === "stickers"
            ? (
                <div className="grid grid-cols-3 gap-2 p-1 sm:grid-cols-4">
                  {stickerShelf.map((asset) => renderAssetTile(asset))}
                  {renderAssetTile(MAGIC_CHEST_ASSET)}
                </div>
              )
            : shelf.length === 0
              ? (
                  <p className="fine-print m-0 px-1 py-4">No assets in this shelf yet.</p>
                )
              : (
                  <div className="grid grid-cols-3 gap-2 p-1 sm:grid-cols-4">
                    {shelf.map((asset) => renderAssetTile(asset))}
                  </div>
                )}
    </>
  );

  const dockButtonClass =
    "flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-pink-200 bg-white/95 px-2.5 py-1.5 text-[0.6rem] font-black text-pink-700 shadow-md backdrop-blur-md transition active:scale-95";

  return (
    <>
      {/* —— Landscape binder: docked right tray —— */}
      {isLandscapeBook ? (
      <aside
        className={`print-hide pointer-events-auto fixed right-0 top-[4.5rem] z-30 flex h-[calc(100vh-4.5rem)] w-72 flex-col
          border-l border-pink-200/80 bg-white/85 p-3 shadow-xl backdrop-blur-md xl:w-80
          ${className}`}
        aria-label="Creative tools"
      >
        {onAddSnap ? (
          <AddSnapButton
            onSnapReady={onAddSnap}
            className="mb-2.5 w-full cursor-pointer justify-center gap-2 rounded-2xl py-3 text-sm shadow-md active:scale-95"
          />
        ) : (
          <p className="mb-2.5 text-xs font-black uppercase tracking-wide text-pink-500">
            Creative Dock
          </p>
        )}

        <div className="mb-2 shrink-0 space-y-2">
          {toolTabPills}
          {stickerCatPills}
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto"
          style={{ WebkitOverflowScrolling: "touch", contentVisibility: "auto" }}
        >
          {shelfBody}
        </div>
      </aside>
      ) : null}

      {/* —— Portrait: floating thumb-zone dock + bottom sheet —— */}
      {isPortrait ? (
        <>
          {snap !== "collapsed" ? (
            <button
              type="button"
              aria-label="Close sticker tray"
              className="pointer-events-auto fixed inset-0 z-[35] bg-slate-900/15"
              onClick={() => setSnap("collapsed")}
            />
          ) : null}

        <div className={`print-hide pointer-events-none fixed inset-x-0 bottom-0 z-40 ${className}`}>
          {/* Dock */}
          <div className="pointer-events-auto relative z-10 mx-auto mb-3 flex max-w-lg items-end justify-center gap-2 rounded-3xl border border-pink-100/60 bg-white/40 px-3 py-2 shadow-lg backdrop-blur-md pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={openStickersSheet}
              className={`${dockButtonClass} ${snap !== "collapsed" && tab === "stickers" ? "border-pink-400 bg-pink-50 ring-2 ring-pink-300/50" : ""}`}
              aria-expanded={snap !== "collapsed" && tab === "stickers"}
            >
              <span className="text-xl" aria-hidden>
                🎀
              </span>
              Stickers
            </button>

            {onAddSnap ? (
              <>
                <button
                  type="button"
                  onClick={() => snapInputRef.current?.click()}
                  className={dockButtonClass}
                  aria-label="Add Snap"
                >
                  <span className="text-xl" aria-hidden>
                    📸
                  </span>
                  Add Snap
                </button>
                <input
                  ref={snapInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void readFileAsDataUrl(file)
                      .then((dataUrl) => {
                        onAddSnap(dataUrl);
                        setSnap("collapsed");
                      })
                      .catch((err) => console.error("Snap read failed", err));
                    e.target.value = "";
                  }}
                />
              </>
            ) : null}

            <button
              type="button"
              onClick={openPaperSheet}
              className={`${dockButtonClass} ${snap !== "collapsed" && tab === "paper" ? "border-pink-400 bg-pink-50 ring-2 ring-pink-300/50" : ""}`}
            >
              <span className="text-xl" aria-hidden>
                🎨
              </span>
              Paper
            </button>

            {onUndo ? (
              <button
                type="button"
                onClick={() => {
                  void ensureAudio().then(() => playPop());
                  onUndo();
                }}
                className={dockButtonClass}
                aria-label="Undo"
              >
                <span className="text-xl" aria-hidden>
                  ↩️
                </span>
                Undo
              </button>
            ) : null}
          </div>

          {/* Bottom sheet */}
          <div
            className="pointer-events-auto relative z-10 mx-auto w-full max-w-lg overflow-hidden rounded-t-3xl border-2 border-b-0 border-pink-200
              bg-white/95 shadow-[0_-12px_40px_rgba(74,43,69,0.22)] backdrop-blur-md transition-[height] duration-300 ease-out"
            style={{
              height: SNAP_HEIGHT[snap],
              maxHeight: SNAP_HEIGHT[snap],
            }}
            role="dialog"
            aria-modal={snap !== "collapsed"}
            aria-label="Sticker tray"
          >
            <div className="relative flex items-center justify-center px-3 pb-1 pt-2">
              <div
                className="flex flex-1 cursor-grab flex-col items-center gap-1 active:cursor-grabbing"
                onPointerDown={(e) => {
                  dragStartY.current = e.clientY;
                  dragStartSnap.current = snap;
                  try {
                    (e.currentTarget as HTMLElement).setPointerCapture(
                      e.pointerId,
                    );
                  } catch {
                    /* ignore */
                  }
                }}
                onPointerMove={(e) => {
                  if (dragStartY.current == null) return;
                  const dy = e.clientY - dragStartY.current;
                  if (dy > 70) {
                    setSnap(
                      dragStartSnap.current === "expanded"
                        ? "peek"
                        : "collapsed",
                    );
                    dragStartY.current = null;
                  } else if (dy < -50) {
                    setSnap(
                      dragStartSnap.current === "collapsed"
                        ? "peek"
                        : "expanded",
                    );
                    dragStartY.current = null;
                  }
                }}
                onPointerUp={() => {
                  dragStartY.current = null;
                }}
                onClick={() => {
                  if (snap === "peek") setSnap("expanded");
                  else if (snap === "expanded") setSnap("peek");
                }}
              >
                <span className="h-1.5 w-12 rounded-full bg-pink-200" />
                <span className="text-[0.65rem] font-black text-pink-500">
                  {snap === "expanded" ? "▼ Peek" : "▲ Expand tray"}
                </span>
              </div>
              {snap !== "collapsed" ? (
                <button
                  type="button"
                  aria-label="Close tray"
                  onClick={() => setSnap("collapsed")}
                  className="absolute right-3 top-2 z-20 inline-flex min-h-[40px] min-w-[40px] items-center justify-center
                    rounded-full border-2 border-pink-200 bg-white text-base font-black text-pink-600 shadow-md
                    transition hover:bg-pink-50 active:scale-95"
                >
                  ✖
                </button>
              ) : null}
            </div>

            {snap !== "collapsed" ? (
              <div className="flex h-[calc(100%-3rem)] flex-col gap-2 px-3 pb-3">
                <div className="shrink-0 space-y-2">
                  {toolTabPills}
                  {stickerCatPills}
                </div>
                <div
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {shelfBody}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        </>
      ) : null}
    </>
  );
}

export default AssetDrawer;
