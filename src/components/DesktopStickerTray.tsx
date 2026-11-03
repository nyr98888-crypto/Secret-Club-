"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useVipAccess } from "@/hooks/useVipAccess";
import {
  DEFAULT_STICKER_MANIFEST,
  type ManifestSticker,
  type StickerManifest,
} from "./StickerFlyoutSystem";

type Category = {
  id: string;
  label: string;
  icon: string;
  /** Entire pack gated behind VIP / promo key */
  isPremium?: boolean;
};

/** Maps to real folders under public/stickers */
const CATEGORIES: Category[] = [
  { id: "kawaii_animals", label: "Animals", icon: "🐾" },
  { id: "glitter_sparkles", label: "Glitter", icon: "✨" },
  { id: "gems_and_ribbons", label: "Gems & Bows", icon: "🎀" },
  { id: "sweet_treats", label: "Sweets", icon: "🧁" },
  { id: "sweet_stationery", label: "Stationery", icon: "✏️" },
  { id: "locks_and_keys", label: "Locks", icon: "🗝️", isPremium: true },
  { id: "tactile_stationery", label: "Tape & Pins", icon: "📎" },
  { id: "tactile_charms", label: "Charms", icon: "🔮" },
  { id: "chibi_characters", label: "Chibis", icon: "👧", isPremium: true },
  { id: "diverse_chibis", label: "Squad", icon: "🧸", isPremium: true },
  { id: "doodles_and_botanicals", label: "Doodles", icon: "🌿" },
  { id: "friendship_badges", label: "Badges", icon: "🏅" },
  { id: "y2k_cyber", label: "Y2K", icon: "💿", isPremium: true },
];

export type TrayTool = {
  id: string;
  label: string;
  icon: string;
  content: ReactNode;
};

type DesktopStickerTrayProps = {
  stickerManifest?: StickerManifest;
  onAddSticker: (sticker: ManifestSticker, opts?: { locked?: boolean }) => void;
  onRequestVip?: (reason?: string) => void;
  /** Full-width Add Snap (or similar) pinned above category pills */
  headerAction?: ReactNode;
  toolPanels?: TrayTool[];
  className?: string;
};

/**
 * Desktop right sidebar — fixed viewport height, sticky header, vertical sticker grid.
 */
export function DesktopStickerTray({
  stickerManifest = DEFAULT_STICKER_MANIFEST,
  onAddSticker,
  onRequestVip,
  headerAction,
  toolPanels = [],
  className = "",
}: DesktopStickerTrayProps) {
  const { isUnlocked } = useVipAccess();

  const categories = useMemo(
    () =>
      CATEGORIES.filter(
        (cat) => (stickerManifest[cat.id]?.items?.length ?? 0) > 0,
      ),
    [stickerManifest],
  );

  const defaultCat = categories[0]?.id ?? "kawaii_animals";
  const [activeCategory, setActiveCategory] = useState(defaultCat);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const activePack =
    categories.find((c) => c.id === activeCategory) ?? categories[0];
  const packIsPremium = Boolean(activePack?.isPremium);
  const isLocked = !isUnlocked() && packIsPremium;

  const currentStickers = stickerManifest?.[activeCategory]?.items ?? [];
  const activeToolPanel = toolPanels.find((t) => t.id === activeTool);

  return (
    <aside
      className={`print-hide z-20 flex h-full min-h-0 w-[380px] shrink-0 flex-col border-l border-pink-200 bg-white/95 shadow-2xl backdrop-blur-md ${className}`}
      aria-label="Sticker studio"
    >
      <div className="shrink-0 border-b border-pink-100 p-4">
        {headerAction ? <div className="mb-3">{headerAction}</div> : null}

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const isActive = !activeTool && activeCategory === cat.id;
            const packLocked = !isUnlocked() && Boolean(cat.isPremium);
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
                {packLocked ? " 🔒" : ""}
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

        {isLocked && !activeTool ? (
          <button
            type="button"
            onClick={() =>
              onRequestVip?.(
                "💖 Unlock this Bestie Vault pack with a VIP Club Key.",
              )
            }
            className="mt-3 w-full rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 text-left text-[0.7rem] font-bold text-pink-700 transition hover:bg-pink-100"
          >
            ✨ Vault pack — unlock to use every sticker
          </button>
        ) : null}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-8">
        {activeToolPanel ? (
          activeToolPanel.content
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {currentStickers.length === 0 ? (
              <p className="col-span-3 text-xs font-bold text-pink-400">
                No stickers in this pack yet.
              </p>
            ) : (
              currentStickers.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => {
                    if (isLocked) {
                      onRequestVip?.(
                        "💖 Unlock this Bestie Vault pack with a VIP Club Key.",
                      );
                    }
                    onAddSticker(sticker, { locked: isLocked });
                  }}
                  className={`group relative flex aspect-square items-center justify-center rounded-2xl border border-pink-100 bg-pink-50/50 p-2 shadow-sm transition-transform hover:scale-105 hover:bg-pink-100/70 active:scale-95 ${
                    isLocked ? "opacity-70" : ""
                  }`}
                  aria-label={
                    isLocked
                      ? `${sticker.name} — Vault exclusive`
                      : `Place ${sticker.name}`
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sticker.src}
                    alt={sticker.name}
                    className={`pointer-events-none max-h-full max-w-full object-contain drop-shadow-sm group-hover:drop-shadow-md ${
                      isLocked ? "opacity-55" : ""
                    }`}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  {isLocked ? (
                    <span className="pointer-events-none absolute right-1 top-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[0.55rem] font-bold text-[#2D0C1E] shadow-sm">
                      🔒
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default DesktopStickerTray;
