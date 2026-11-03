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
import { DesktopStickerTray } from "./DesktopStickerTray";
import type { ManifestSticker } from "./StickerFlyoutSystem";
import { useDeviceLayout } from "@/hooks/useDeviceLayout";
import { ensureAudio, playPop } from "@/lib/audio";
import {
  PHOTO_FILE_ACCEPT,
  processPhotoFile,
} from "@/lib/photoDataUrl";
import { useVaultAccess } from "@/hooks/useVaultAccess";

/** Folder ids treated as fully vault-gated in the desktop tray */
const PREMIUM_MANIFEST_FOLDERS = new Set([
  "chibi_characters",
  "coquette",
  "locks_and_keys",
]);

type DrawerTab = AssetCategory | "paper";
export type SheetSnap = "collapsed" | "peek" | "expanded";

type AssetDrawerProps = {
  assets?: DrawerAsset[];
  onPlaceAsset: (asset: DrawerAsset) => void;
  onRequestPoke?: () => void;
  onRequestVip?: (reason?: string) => void;
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
    withFreeTierApplied,
    canUsePaper,
  } = useVaultAccess();
  const compact = isPortrait;
  const [tab, setTab] = useState<DrawerTab>("stickers");
  const [stickerTab, setStickerTab] = useState<StickerTabId>("animals");
  const deferredStickerTab = useDeferredValue(stickerTab);
  const [brokenIds, setBrokenIds] = useState<Record<string, true>>({});
  const [internalSnap, setInternalSnap] = useState<SheetSnap>("collapsed");
  const [snapBusy, setSnapBusy] = useState(false);
  /** Soft tip for vault-only tiles — never auto-opens the paywall modal */
  const [vaultTipId, setVaultTipId] = useState<string | null>(null);
  const snap = sheetSnapProp ?? internalSnap;
  const dragStartY = useRef<number | null>(null);
  const dragStartSnap = useRef<SheetSnap>("peek");
  const snapInputRef = useRef<HTMLInputElement>(null);

  function openSnapPicker() {
    if (snapBusy) return;
    const input = snapInputRef.current;
    if (!input) return;
    // Reset + sync click inside the tap gesture (iOS requirement)
    input.value = "";
    input.click();
  }

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
    setVaultTipId(null);
    setTab(next);
    if (compact && snap === "collapsed") setSnap("peek");
    if (next === "pokes") onRequestPoke?.();
  }

  function selectStickerTab(next: StickerTabId) {
    setVaultTipId(null);
    startTransition(() => setStickerTab(next));
  }

  function pick(asset: DrawerAsset) {
    const gated = withFreeTierApplied(asset);
    // Magic Chest still opens the vault modal; pokes open composer
    if (asset.id === MAGIC_CHEST_ASSET.id || asset.action === "compose-poke") {
      if (asset.action === "compose-poke") {
        onRequestPoke?.();
        return;
      }
      onRequestVip?.();
      return;
    }
    // Locked tiles: place as preview + soft tip — never hijack with full-screen paywall
    if (gated.locked || gated.action === "open-vip") {
      setVaultTipId(asset.id);
      window.setTimeout(() => {
        setVaultTipId((cur) => (cur === asset.id ? null : cur));
      }, 2400);
      onPlaceAsset({ ...gated, locked: true, action: "open-vip" });
      if (compact) setSnap("collapsed");
      return;
    }
    setVaultTipId(null);
    onPlaceAsset(asset);
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

  const unlockAllCta =
    !isVip ? (
      <button
        type="button"
        onClick={() => onRequestVip?.()}
        className="inline-flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#2D0C1E]/35
          bg-transparent px-2 py-1.5 text-[0.65rem] font-semibold text-[#2D0C1E]/70 transition hover:bg-white/60 active:scale-[0.99]"
      >
        <span aria-hidden>✨</span>
        Unlock full Bestie Vault anytime
      </button>
    ) : null;

  const toolTabPills = isLandscapeBook ? (
    <div
      className="flex flex-wrap gap-1.5 rounded-xl bg-pink-50/70 p-1"
      role="tablist"
      aria-label="Asset categories"
    >
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => selectTab(t.id)}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              active
                ? "bg-white text-pink-600 shadow"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  ) : (
    <div
      className="flex gap-1.5 overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar pb-0.5"
      role="tablist"
      aria-label="Asset categories"
    >
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => selectTab(t.id)}
            className={`inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full px-3 text-[0.75rem] font-bold transition
              ${
                active
                  ? "border-2 border-[#2D0C1E] bg-[#2D0C1E] text-white shadow-sm"
                  : "border-2 border-[#2D0C1E] bg-white text-[#2D0C1E]"
              }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );

  const stickerCatPills =
    tab === "stickers" ? (
      <div
        className={
          isLandscapeBook
            ? "flex flex-wrap gap-1.5"
            : "flex gap-1.5 overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar"
        }
        role="tablist"
        aria-label="Sticker packs"
      >
        {STICKER_TABS.map((t) => {
          const active = stickerTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectStickerTab(t.id)}
              className={
                isLandscapeBook
                  ? `rounded-lg px-2.5 py-1 text-[0.7rem] font-bold transition-all ${
                      active
                        ? "bg-white text-pink-600 shadow"
                        : "bg-pink-50/80 text-gray-500 hover:text-gray-800"
                    }`
                  : `inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full px-3 text-[0.7rem] font-bold transition ${
                      active
                        ? "border-2 border-[#2D0C1E] bg-[#2D0C1E] text-white shadow-sm"
                        : "border-2 border-[#2D0C1E] bg-white text-[#2D0C1E]"
                    }`
              }
            >
              {t.icon ? `${t.icon} ` : ""}
              {t.label}
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
    const showTip = vaultTipId === asset.id && Boolean(asset.locked);
    const desk = isLandscapeBook;

    return (
      <div key={asset.id} className="relative flex flex-col items-stretch gap-1">
        <button
          type="button"
          role="option"
          aria-selected={false}
          onClick={() => pick(asset)}
          className={
            desk
              ? `group relative flex aspect-square items-center justify-center rounded-xl border border-pink-100
                  bg-pink-50/40 p-2 transition-transform hover:scale-105 hover:bg-pink-100/60 active:scale-95
                  ${asset.locked ? "border-dashed opacity-80" : ""}`
              : `group relative flex min-h-[56px] flex-col items-center justify-center rounded-xl border-2
                  p-1.5 transition hover:-translate-y-1 hover:shadow-md active:scale-95 active:-translate-y-0.5
                  ${
                    asset.locked
                      ? "border-dashed border-[#2D0C1E]/45 bg-[#fff9f5]"
                      : hideLabel
                        ? "border-transparent bg-transparent hover:border-[#2D0C1E]/35 hover:bg-white/70"
                        : "border-[#2D0C1E] bg-white hover:bg-[#2D0C1E]/5"
                  }`
          }
          aria-label={
            asset.locked ? `${asset.label} — Vault exclusive` : `Place ${asset.label}`
          }
        >
          <span
            className={`grid place-items-center overflow-hidden transition-transform duration-200
              ${desk ? "h-full w-full" : `min-h-[48px] w-full group-hover:scale-110 group-active:scale-95 ${hideLabel ? "py-1" : ""}`}
              ${asset.locked ? "opacity-55" : ""}`}
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
                className={
                  desk
                    ? "pointer-events-none max-h-full max-w-full object-contain drop-shadow-sm"
                    : "max-h-14 max-w-full object-contain drop-shadow-sm"
                }
                draggable={false}
                onError={() => markBroken(asset.id)}
              />
            ) : (
              <span aria-hidden>✨</span>
            )}
          </span>
          {!desk && (!hideLabel || asset.locked) ? (
            <span className="w-full truncate text-center text-[0.7rem] font-bold text-[#2D0C1E]">
              {asset.label}
            </span>
          ) : null}
          {asset.locked ? (
            <span className="pointer-events-none absolute right-1 top-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[0.55rem] font-bold text-[#2D0C1E] shadow-sm">
              ✨
            </span>
          ) : null}
        </button>
        {showTip ? (
          <div
            role="status"
            className="rounded-xl border border-[#2D0C1E]/25 bg-white/95 px-2 py-1.5 text-center shadow-md"
          >
            <p className="m-0 text-[0.65rem] font-bold text-[#2D0C1E]">
              Vault Exclusive ✨ — preview on page
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  function renderSplitShelf(list: DrawerAsset[]) {
    const free = list.filter((a) => !a.locked);
    const vault = list.filter((a) => a.locked);
    const gridClass = isLandscapeBook
      ? "grid grid-cols-3 gap-3"
      : "grid grid-cols-3 gap-2 sm:grid-cols-4";
    return (
      <div className="flex flex-col gap-3 p-1">
        {free.length > 0 ? (
          <section>
            <p className="mb-1.5 px-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#2D0C1E]">
              Free Starter Pack
            </p>
            <div className={gridClass}>
              {free.map((asset) => renderAssetTile(asset))}
            </div>
          </section>
        ) : null}
        {vault.length > 0 ? (
          <section>
            <p className="mb-1.5 px-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#2D0C1E]/80">
              Bestie Vault Packs
            </p>
            <div className={gridClass}>
              {vault.map((asset) => renderAssetTile(asset))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  const shelfBody = (
    <>
      {tab === "paper"
        ? (
            <div className="flex flex-col gap-3 p-1">
              <section>
                <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#2D0C1E]">
                  Free Starter Pack
                </p>
                <div
                  className={
                    isLandscapeBook
                      ? "grid grid-cols-3 gap-3"
                      : "grid grid-cols-3 gap-2 sm:grid-cols-4"
                  }
                >
                  {PAPER_PALETTE.filter((s) => canUsePaper(s.id) || isVip).map(
                    (swatch) => {
                      const active = paperId === swatch.id;
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            onSelectPaper?.(swatch.id);
                            if (compact) setSnap("collapsed");
                          }}
                          className={`group relative flex min-h-[56px] flex-col items-center gap-1 rounded-2xl border-2 p-1.5 transition
                            hover:-translate-y-0.5 hover:shadow-md active:scale-95
                            ${
                              active
                                ? "border-[#2D0C1E] ring-2 ring-[#2D0C1E]/25"
                                : "border-[#2D0C1E] bg-white"
                            }`}
                          aria-label={`Use ${swatch.label} paper`}
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
                            {swatch.emoji}
                          </span>
                          <span className="w-full truncate text-center text-[0.7rem] font-bold leading-tight text-[#2D0C1E]">
                            {swatch.label}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </section>
              {!isVip ? (
                <section>
                  <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#2D0C1E]/80">
                    Bestie Vault Packs
                  </p>
                  <div
                    className={
                      isLandscapeBook
                        ? "grid grid-cols-3 gap-3"
                        : "grid grid-cols-3 gap-2 sm:grid-cols-4"
                    }
                  >
                    {PAPER_PALETTE.filter((s) => !canUsePaper(s.id)).map(
                      (swatch) => {
                        const showTip = vaultTipId === `paper-${swatch.id}`;
                        return (
                          <div key={swatch.id} className="flex flex-col gap-1">
                            <button
                              type="button"
                              role="option"
                              aria-selected={false}
                              onClick={() => setVaultTipId(`paper-${swatch.id}`)}
                              className="group relative flex min-h-[56px] flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-[#2D0C1E]/45 bg-[#fff9f5] p-1.5"
                              aria-label={`${swatch.label} — Vault exclusive`}
                            >
                              <span
                                className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-pink-100 text-lg opacity-55 shadow-inner"
                                style={{
                                  backgroundColor: swatch.backgroundColor,
                                  backgroundImage:
                                    swatch.backgroundImage ?? "none",
                                  backgroundSize: swatch.backgroundSize ?? "auto",
                                  backgroundRepeat: swatch.backgroundImage
                                    ? "repeat"
                                    : "no-repeat",
                                }}
                                aria-hidden
                              >
                                {swatch.emoji}
                              </span>
                              <span className="w-full truncate text-center text-[0.7rem] font-bold leading-tight text-[#2D0C1E]">
                                {swatch.label}
                              </span>
                              <span className="absolute right-1 top-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[0.55rem] font-bold">
                                ✨
                              </span>
                            </button>
                            {showTip ? (
                              <div
                                role="status"
                                className="rounded-xl border border-[#2D0C1E]/25 bg-white/95 px-2 py-1.5 text-center shadow-md"
                              >
                                <p className="m-0 text-[0.65rem] font-bold text-[#2D0C1E]">
                                  Vault Exclusive ✨
                                </p>
                              </div>
                            ) : null}
                          </div>
                        );
                      },
                    )}
                  </div>
                </section>
              ) : null}
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
                  border-[#2D0C1E] bg-white px-3 py-4 transition active:scale-[0.99]"
                aria-label="Open sweet poke sound charms"
              >
                <span className="text-2xl" aria-hidden>
                  💖
                </span>
                <span className="text-left">
                  <span className="block text-sm font-bold text-[#2D0C1E]">
                    Sound Charms
                  </span>
                  <span className="block text-[0.7rem] font-bold text-[#2D0C1E]/80">
                    Stick a poke on the page
                  </span>
                </span>
              </button>
            )
          : tab === "stickers"
            ? (
                <>
                  {renderSplitShelf(stickerShelf)}
                  <div className="px-1 pb-2 pt-1">
                    {renderAssetTile(MAGIC_CHEST_ASSET, { hideLabel: false })}
                  </div>
                </>
              )
            : shelf.length === 0
              ? (
                  <p className="m-0 px-1 py-4 text-sm font-bold text-[#2D0C1E]">
                    No assets in this shelf yet.
                  </p>
                )
              : (
                  renderSplitShelf(shelf)
                )}
    </>
  );

  const dockButtonClass =
    "flex min-h-[56px] min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#2D0C1E] bg-white px-2 py-1.5 text-[12px] font-bold leading-tight text-[#2D0C1E] transition active:scale-95 active:bg-[#2D0C1E]/5";

  return (
    <>
      {/* —— PC desktop: right sidebar (viewport-locked, vertical scroll) —— */}
      {isLandscapeBook ? (
        <DesktopStickerTray
          className={className}
          onRequestVip={onRequestVip}
          onAddSticker={(sticker: ManifestSticker, opts) => {
            const fromSrc =
              sticker.src.match(/^\/stickers\/([^/]+)\//)?.[1] ?? "";
            const premiumPack =
              Boolean(opts?.locked) || PREMIUM_MANIFEST_FOLDERS.has(fromSrc);

            pick({
              id: sticker.id.startsWith("sticker-")
                ? sticker.id
                : `sticker-${sticker.id}`,
              category: "stickers",
              label: sticker.name,
              src: sticker.src,
              defaultWidth: 18,
              locked: !isVip && premiumPack ? true : undefined,
              action: !isVip && premiumPack ? "open-vip" : undefined,
            });
          }}
          headerAction={
            onAddSnap ? (
              <AddSnapButton
                onSnapReady={onAddSnap}
                className="w-full justify-center !rounded-2xl !py-2.5 !shadow-sm hover:opacity-95"
              />
            ) : null
          }
          toolPanels={[
            {
              id: "frames",
              label: "Frames",
              icon: "🖼️",
              content: (
                <div className="grid grid-cols-3 gap-3">
                  {assets
                    .filter((a) => a.category === "frames")
                    .map(withFreeTierApplied)
                    .map((asset) => renderAssetTile(asset))}
                </div>
              ),
            },
            {
              id: "washi",
              label: "Washi",
              icon: "🎀",
              content: (
                <div className="grid grid-cols-3 gap-3">
                  {assets
                    .filter((a) => a.category === "washi")
                    .map(withFreeTierApplied)
                    .map((asset) => renderAssetTile(asset))}
                </div>
              ),
            },
            {
              id: "gems",
              label: "Gems",
              icon: "💎",
              content: (
                <div className="grid grid-cols-3 gap-3">
                  {assets
                    .filter((a) => a.category === "gems")
                    .map(withFreeTierApplied)
                    .map((asset) => renderAssetTile(asset))}
                </div>
              ),
            },
            {
              id: "paper",
              label: "Paper",
              icon: "📄",
              content: (
                <div className="grid grid-cols-3 gap-3">
                  {PAPER_PALETTE.map((swatch) => {
                    const locked = !canUsePaper(swatch.id) && !isVip;
                    const active = paperId === swatch.id;
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => {
                          if (locked) {
                            setVaultTipId(`paper-${swatch.id}`);
                            onRequestVip?.();
                            return;
                          }
                          onSelectPaper?.(swatch.id);
                        }}
                        className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border p-2 transition ${
                          locked
                            ? "border-dashed border-pink-200 bg-pink-50/40 opacity-70"
                            : active
                              ? "border-pink-400 bg-pink-50 ring-2 ring-pink-200"
                              : "border-pink-100 bg-pink-50/50 hover:bg-pink-100/70"
                        }`}
                        aria-label={`Use ${swatch.label} paper`}
                      >
                        <span
                          className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-pink-100 text-lg shadow-inner"
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
                          {swatch.emoji}
                        </span>
                        <span className="w-full truncate text-center text-[0.65rem] font-bold text-[#2D0C1E]">
                          {swatch.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ),
            },
            {
              id: "pokes",
              label: "Pokes",
              icon: "💖",
              content: (
                <button
                  type="button"
                  onClick={() => onRequestPoke?.()}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-pink-200 bg-pink-50 p-4 text-left transition hover:bg-pink-100"
                >
                  <span className="text-2xl" aria-hidden>
                    💖
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-[#2D0C1E]">
                      Sound Charms
                    </span>
                    <span className="block text-[0.7rem] font-bold text-[#2D0C1E]/80">
                      Stick a poke on the page
                    </span>
                  </span>
                </button>
              ),
            },
          ]}
        />
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
          {/* Dock — pinned full-bleed bar; slides away when tray opens */}
          <div
            className={`pointer-events-auto relative z-10 flex w-full items-stretch justify-between gap-2
              border-t-2 border-[#2D0C1E] bg-white px-2.5 pt-2.5
              pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(45,12,30,0.14)]
              transition-all duration-300 ease-out
              ${
                snap !== "collapsed"
                  ? "pointer-events-none translate-y-[130%] opacity-0"
                  : "translate-y-0 opacity-100"
              }`}
            aria-hidden={snap !== "collapsed"}
          >
            <button
              type="button"
              onClick={openStickersSheet}
              className={dockButtonClass}
              aria-expanded={snap !== "collapsed" && tab === "stickers"}
            >
              <span className="leading-none" style={{ fontSize: 28 }} aria-hidden>
                🎀
              </span>
              Stickers
            </button>

            {onAddSnap ? (
              <>
                <button
                  type="button"
                  disabled={snapBusy}
                  onClick={openSnapPicker}
                  className={`${dockButtonClass} ${snapBusy ? "animate-pulse opacity-80" : ""}`}
                  aria-label="Add Snap"
                  aria-busy={snapBusy}
                >
                  <span className="leading-none" style={{ fontSize: 28 }} aria-hidden>
                    {snapBusy ? "⏳" : "📸"}
                  </span>
                  {snapBusy ? "Wait…" : "Add Snap"}
                </button>
                <input
                  ref={snapInputRef}
                  type="file"
                  accept={PHOTO_FILE_ACCEPT}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                  onChange={(e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    input.value = "";
                    if (!file || !onAddSnap) return;
                    setSnapBusy(true);
                    void processPhotoFile(file)
                      .then((dataUrl) => {
                        onAddSnap(dataUrl);
                        setSnap("collapsed");
                      })
                      .catch((err) => console.error("Snap read failed", err))
                      .finally(() => setSnapBusy(false));
                  }}
                />
              </>
            ) : null}

            <button
              type="button"
              onClick={openPaperSheet}
              className={dockButtonClass}
            >
              <span className="leading-none" style={{ fontSize: 28 }} aria-hidden>
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
                <span className="leading-none" style={{ fontSize: 28 }} aria-hidden>
                  ↩️
                </span>
                Undo
              </button>
            ) : null}
          </div>

          {/* Bottom sheet */}
          <div
            className="pointer-events-auto relative z-20 mx-auto w-full max-w-lg overflow-hidden rounded-t-3xl border-2 border-b-0 border-[#2D0C1E]
              bg-white shadow-[0_-12px_40px_rgba(45,12,30,0.22)] transition-[height] duration-300 ease-out"
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
                <span className="h-1.5 w-12 rounded-full bg-[#2D0C1E]/25" />
                <span className="text-[0.7rem] font-bold text-[#1F1F2E]">
                  {snap === "expanded" ? "▼ Peek" : "▲ Expand tray"}
                </span>
              </div>
              {snap !== "collapsed" ? (
                <button
                  type="button"
                  aria-label="Close tray"
                  onClick={() => setSnap("collapsed")}
                  className="absolute right-2.5 top-1.5 z-30 inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center
                    rounded-full border-2 border-white bg-[#2D0C1E] text-lg font-black text-white
                    shadow-[0_4px_12px_rgba(45,12,30,0.35)] transition hover:bg-[#1a0712] active:scale-95"
                >
                  ✖
                </button>
              ) : null}
            </div>

            {snap !== "collapsed" ? (
              <div className="flex h-[calc(100%-3rem)] flex-col gap-2 px-3 pb-3">
                <div className="shrink-0 space-y-2">
                  {unlockAllCta}
                  {toolTabPills}
                  {stickerCatPills}
                </div>
                <div
                  className="asset-tray-scroll no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
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
