"use client";

import { useMemo, useState, type ReactNode } from "react";
import { STICKER_TABS, stickersForTab } from "@/constants/stickers";
import { useVipAccess } from "@/hooks/useVipAccess";
import { isStickerLocked } from "@/lib/vaultAccess";
import type { ManifestSticker } from "./StickerFlyoutSystem";

export type TrayTool = {
  id: string;
  label: string;
  icon: string;
  content: ReactNode;
};

type DesktopStickerTrayProps = {
  onAddSticker: (sticker: ManifestSticker, opts?: { locked?: boolean }) => void;
  onRequestVip?: (reason?: string) => void;
  /** Full-width Add Snap (or similar) pinned above category pills */
  headerAction?: ReactNode;
  toolPanels?: TrayTool[];
  className?: string;
};

/**
 * Desktop right sidebar — fixed viewport height, sticky header, vertical sticker grid.
 * Freemium: first 3 stickers per category free; rest open Unlock Full Studio.
 */
export function DesktopStickerTray({
  onAddSticker,
  onRequestVip,
  headerAction,
  toolPanels = [],
  className = "",
}: DesktopStickerTrayProps) {
  const { isUnlocked, isVip } = useVipAccess();

  const categories = STICKER_TABS;
  const defaultCat = categories[0]?.id ?? "animals";
  const [activeCategory, setActiveCategory] = useState(defaultCat);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [brokenIds, setBrokenIds] = useState<Record<string, true>>({});

  const currentStickers = useMemo(
    () => stickersForTab(activeCategory),
    [activeCategory],
  );
  const activeToolPanel = toolPanels.find((t) => t.id === activeTool);
  const vip = isVip || isUnlocked();

  return (
    <aside
      className={`print-hide z-20 flex h-full min-h-0 w-[380px] max-w-full shrink-0 flex-col overflow-hidden border-l border-pink-200 bg-white/95 shadow-2xl backdrop-blur-md ${className}`}
      aria-label="Sticker studio"
    >
      <div className="shrink-0 border-b border-pink-100 p-4">
        {headerAction ? <div className="mb-3">{headerAction}</div> : null}

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const isActive = !activeTool && activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveTool(null);
                  setActiveCategory(cat.id);
                }}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-pink-500 text-white shadow-sm"
                    : "bg-pink-50 text-gray-600 hover:bg-pink-100"
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            );
          })}

          {toolPanels.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-violet-500 text-white shadow-sm"
                    : "bg-violet-50 text-gray-600 hover:bg-violet-100"
                }`}
              >
                {tool.icon} {tool.label}
              </button>
            );
          })}
        </div>

        {!vip && !activeTool ? (
          <p className="mt-3 text-[0.65rem] font-bold text-pink-500/90">
            First 3 stickers free in every pack · unlock Full Studio for the rest
          </p>
        ) : null}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-4 pb-8">
        {activeToolPanel ? (
          activeToolPanel.content
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {currentStickers.length === 0 ? (
              <p className="col-span-3 text-xs font-bold text-pink-400">
                No stickers in this pack yet.
              </p>
            ) : (
              currentStickers.map((sticker, index) => {
                const locked = isStickerLocked(index, vip);
                const broken = Boolean(brokenIds[sticker.id]);
                return (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => {
                      if (locked) {
                        onRequestVip?.(
                          "💖 Unlock Full Studio ($4.99) to use every sticker.",
                        );
                        return;
                      }
                      onAddSticker(
                        {
                          id: sticker.id,
                          name: sticker.name,
                          src: sticker.src,
                        },
                        { locked: false },
                      );
                    }}
                    className={`group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-pink-100 bg-pink-50/50 p-2 shadow-sm transition-transform hover:scale-105 hover:bg-pink-100/70 active:scale-95 ${
                      locked ? "opacity-80" : ""
                    }`}
                    aria-label={
                      locked
                        ? `${sticker.name} — Unlock Full Studio`
                        : `Place ${sticker.name}`
                    }
                  >
                    {broken ? (
                      <span
                        className="invisible block h-full w-full"
                        aria-hidden
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sticker.src}
                        alt=""
                        className={`pointer-events-none max-h-full max-w-full object-contain drop-shadow-sm group-hover:drop-shadow-md ${
                          locked ? "opacity-55" : ""
                        }`}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onError={() =>
                          setBrokenIds((prev) =>
                            prev[sticker.id] ? prev : { ...prev, [sticker.id]: true },
                          )
                        }
                      />
                    )}
                    {locked ? (
                      <span className="pointer-events-none absolute right-1 top-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[0.55rem] font-bold text-[#2D0C1E] shadow-sm">
                        🔒
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default DesktopStickerTray;
