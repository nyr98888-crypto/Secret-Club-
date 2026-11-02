"use client";

import { useMemo, useState } from "react";
import {
  ASSET_TABS,
  DEFAULT_DRAWER_ASSETS,
  type AssetCategory,
  type DrawerAsset,
} from "@/lib/scrapbookAssets";
import { PAPER_PALETTE, type PaperId } from "@/lib/paperPalette";
import { AddSnapButton } from "./AddSnapButton";

type DrawerTab = AssetCategory | "paper";

type AssetDrawerProps = {
  assets?: DrawerAsset[];
  onPlaceAsset: (asset: DrawerAsset) => void;
  onRequestPoke?: () => void;
  onRequestVip?: () => void;
  onAddSnap?: (photoSrc: string) => void;
  paperId?: PaperId | string;
  onSelectPaper?: (paperId: PaperId) => void;
  /** Collapse mobile sheet (e.g. when decorating / selecting on page) */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
};

const TABS: { id: DrawerTab; label: string }[] = [
  ...ASSET_TABS,
  { id: "paper", label: "Paper" },
];

export function AssetDrawer({
  assets = DEFAULT_DRAWER_ASSETS,
  onPlaceAsset,
  onRequestPoke,
  onRequestVip,
  onAddSnap,
  paperId,
  onSelectPaper,
  collapsed: collapsedProp,
  onCollapsedChange,
  className = "",
}: AssetDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>("stickers");
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const collapsed = collapsedProp ?? internalCollapsed;

  function setCollapsed(next: boolean) {
    onCollapsedChange?.(next);
    if (collapsedProp === undefined) setInternalCollapsed(next);
  }

  const shelf = useMemo(
    () => (tab === "paper" ? [] : assets.filter((a) => a.category === tab)),
    [assets, tab],
  );

  function selectTab(next: DrawerTab) {
    setTab(next);
    setCollapsed(false);
    if (next === "pokes") onRequestPoke?.();
  }

  function pick(asset: DrawerAsset) {
    if (asset.locked || asset.action === "open-vip") {
      onRequestVip?.();
      return;
    }
    if (asset.action === "compose-poke") {
      onRequestPoke?.();
      return;
    }
    onPlaceAsset(asset);
  }

  const tabPills = (
    <div
      className="grid grid-cols-3 gap-1.5"
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
            className={`inline-flex min-h-[36px] items-center justify-center rounded-full px-2 text-[0.65rem] font-extrabold transition
              ${
                active
                  ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-sm"
                  : "border border-pink-200 bg-white/90 text-slate-700 hover:border-pink-300"
              }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );

  const mobileTabList = (
    <div
      className="flex gap-1.5 overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar"
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
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full px-3 text-xs font-extrabold transition
              ${
                active
                  ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-sm"
                  : "border border-[var(--stroke)] bg-white/80 text-[var(--ink)]"
              }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );

  const shelfGrid = (
    <div
      className="grid grid-cols-3 gap-2.5 overflow-y-auto p-1"
      style={{ WebkitOverflowScrolling: "touch" }}
      role="listbox"
      aria-label={`${TABS.find((t) => t.id === tab)?.label ?? "Assets"} shelf`}
    >
      {tab === "paper"
        ? PAPER_PALETTE.map((swatch) => {
            const active = paperId === swatch.id;
            return (
              <button
                key={swatch.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onSelectPaper?.(swatch.id)}
                  className={`group relative flex min-h-[52px] flex-col items-center gap-1 rounded-2xl border-2 p-1.5 transition
                  hover:-translate-y-0.5 hover:shadow-md active:scale-95
                  ${
                    active
                      ? "border-pink-400 ring-2 ring-pink-300/60"
                      : "border-[var(--stroke)] bg-white/80 hover:border-pink-300"
                  }`}
                aria-label={`Use ${swatch.label} paper`}
              >
                <span
                  className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-pink-100 text-lg shadow-inner transition-colors duration-200"
                  style={{
                    backgroundColor: swatch.backgroundColor,
                    backgroundImage: swatch.backgroundImage,
                    backgroundSize: swatch.backgroundSize,
                  }}
                  aria-hidden
                >
                  {swatch.emoji}
                </span>
                <span className="w-full truncate text-center text-[0.55rem] font-bold leading-tight text-[var(--ink)]">
                  {swatch.label}
                </span>
              </button>
            );
          })
        : tab === "pokes"
          ? (
              <button
                type="button"
                role="option"
                onClick={() => onRequestPoke?.()}
                className="col-span-3 flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2
                  border-pink-300 bg-gradient-to-r from-pink-50 to-violet-50 px-3 py-3 transition
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
          : shelf.length === 0
            ? (
                <p className="fine-print col-span-3 m-0 px-1 py-4">
                  No assets in this shelf yet.
                </p>
              )
            : (
                shelf.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    role="option"
                    onClick={() => pick(asset)}
                    className={`group relative flex min-h-[48px] flex-col items-center gap-1 rounded-xl border-2
                      p-1.5 transition hover:-translate-y-0.5 hover:shadow-md active:scale-95
                      ${
                        asset.locked
                          ? "border-dashed border-amber-300 bg-gradient-to-b from-amber-50 to-pink-50"
                          : "border-[var(--stroke)] bg-white/80 hover:border-pink-300"
                      }`}
                    aria-label={
                      asset.locked
                        ? "Unlock the Magic Chest"
                        : `Place ${asset.label}`
                    }
                  >
                    <span className="grid min-h-[40px] min-w-[40px] place-items-center text-2xl">
                      {asset.emoji ? (
                        <span aria-hidden>{asset.emoji}</span>
                      ) : asset.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.src}
                          alt=""
                          className="max-h-10 max-w-10 object-contain drop-shadow-sm"
                          draggable={false}
                        />
                      ) : (
                        <span aria-hidden>✨</span>
                      )}
                    </span>
                    <span className="w-full truncate text-center text-[0.55rem] font-bold text-[var(--ink)]">
                      {asset.locked ? `🔒 ${asset.label}` : asset.label}
                    </span>
                  </button>
                ))
              )}
    </div>
  );

  const mobileShelf = (
    <div
      className="flex gap-2.5 overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar px-2 py-2"
      style={{ WebkitOverflowScrolling: "touch" }}
      role="listbox"
      aria-label={`${TABS.find((t) => t.id === tab)?.label ?? "Assets"} shelf`}
    >
      {tab === "paper"
        ? PAPER_PALETTE.map((swatch) => {
            const active = paperId === swatch.id;
            return (
              <button
                key={swatch.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onSelectPaper?.(swatch.id)}
                className={`group relative flex min-h-[48px] w-[4.75rem] shrink-0 flex-col items-center gap-1 rounded-xl border-2 p-2 transition
                  hover:-translate-y-0.5 hover:shadow-md active:scale-95
                  ${
                    active
                      ? "border-pink-400 ring-2 ring-pink-300/60"
                      : "border-[var(--stroke)] bg-white/80 hover:border-pink-300"
                  }`}
                aria-label={`Use ${swatch.label} paper`}
              >
                <span
                  className="grid h-11 w-11 place-items-center overflow-hidden rounded-lg border border-pink-100 text-lg shadow-inner"
                  style={{
                    backgroundColor: swatch.backgroundColor,
                    backgroundImage: swatch.backgroundImage,
                    backgroundSize: swatch.backgroundSize,
                  }}
                  aria-hidden
                >
                  {swatch.emoji}
                </span>
                <span className="w-full truncate text-center text-[0.6rem] font-bold text-[var(--ink)]">
                  {swatch.label}
                </span>
              </button>
            );
          })
        : tab === "pokes"
          ? (
              <button
                type="button"
                role="option"
                onClick={() => onRequestPoke?.()}
                className="flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-xl border-2
                  border-pink-300 bg-gradient-to-r from-pink-50 to-violet-50 px-3 py-3 transition
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
          : shelf.length === 0
            ? (
                <p className="fine-print m-0 px-1 py-4">No assets in this shelf yet.</p>
              )
            : (
                shelf.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    role="option"
                    onClick={() => pick(asset)}
                    className={`group relative flex min-h-[48px] w-[4.75rem] shrink-0 flex-col items-center gap-1 rounded-xl border-2
                      p-2 transition hover:-translate-y-0.5 hover:shadow-md active:scale-95
                      ${
                        asset.locked
                          ? "border-dashed border-amber-300 bg-gradient-to-b from-amber-50 to-pink-50"
                          : "border-[var(--stroke)] bg-white/80 hover:border-pink-300"
                      }`}
                    aria-label={
                      asset.locked
                        ? "Unlock the Magic Chest"
                        : `Place ${asset.label}`
                    }
                  >
                    <span className="grid min-h-[44px] min-w-[44px] place-items-center text-3xl">
                      {asset.emoji ? (
                        <span aria-hidden>{asset.emoji}</span>
                      ) : asset.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.src}
                          alt=""
                          className="max-h-11 max-w-11 object-contain drop-shadow-sm"
                          draggable={false}
                        />
                      ) : (
                        <span aria-hidden>✨</span>
                      )}
                    </span>
                    <span className="w-full truncate text-center text-[0.6rem] font-bold text-[var(--ink)]">
                      {asset.locked ? `🔒 ${asset.label}` : asset.label}
                    </span>
                  </button>
                ))
              )}
    </div>
  );

  return (
    <>
      {/* —— Desktop / tablet: right art tray —— */}
      <aside
        className={`pointer-events-auto fixed right-0 top-[4.5rem] z-30 hidden h-[calc(100vh-4.5rem)] w-72 flex-col
          border-l border-pink-200/80 bg-white/85 p-4 shadow-xl backdrop-blur-md md:flex xl:w-80
          ${className}`}
        aria-label="Creative tools"
      >
        {onAddSnap ? (
          <AddSnapButton
            onSnapReady={onAddSnap}
            className="mb-3 w-full cursor-pointer justify-center gap-2 rounded-2xl py-3.5 text-sm shadow-md active:scale-95"
          />
        ) : (
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-pink-500">
            Creative Dock
          </p>
        )}

        <div className="mb-3 shrink-0">{tabPills}</div>

        <div className="min-h-0 flex-1 overflow-y-auto">{shelfGrid}</div>
      </aside>

      {/* —— Mobile: collapsible bottom sheet —— */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden ${className}`}
      >
        <div
          className={`pointer-events-auto mx-auto w-full max-w-lg overflow-hidden rounded-t-3xl border-2 border-b-0 border-pink-200
            bg-[var(--panel)] shadow-[0_-8px_30px_rgba(74,43,69,0.18)] backdrop-blur-md transition-transform duration-300 ease-out
            ${collapsed ? "translate-y-[calc(100%-3.25rem)]" : "translate-y-0"}`}
        >
          <button
            type="button"
            className="flex w-full flex-col items-center gap-1 px-3 pt-2 pb-1"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Open sticker tray" : "Hide sticker tray"}
          >
            <span className="h-1.5 w-12 rounded-full bg-pink-200" />
            <span className="text-[0.7rem] font-black text-pink-500">
              {collapsed ? "🎨 Stickers · tap to open" : "▼ Hide tray"}
            </span>
          </button>

          <div className="flex items-end gap-2 px-2 pb-2">
            {onAddSnap ? (
              <AddSnapButton onSnapReady={onAddSnap} className="mb-1 shrink-0" />
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="px-1 pt-1">{mobileTabList}</div>
              {!collapsed ? mobileShelf : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AssetDrawer;
