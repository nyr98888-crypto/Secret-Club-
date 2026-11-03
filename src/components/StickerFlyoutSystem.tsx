"use client";

import { useMemo, useState, type ReactNode } from "react";
import stickerManifestJson from "@/data/stickersManifest.json";

export type ManifestSticker = {
  id: string;
  name: string;
  src: string;
};

export type ManifestCategory = {
  id: string;
  title: string;
  items: ManifestSticker[];
};

export type StickerManifest = Record<string, ManifestCategory>;

type Category = {
  id: string;
  name: string;
  icon: string;
};

/** Dock categories — ids must exist in stickersManifest.json */
const CATEGORIES: Category[] = [
  { id: "kawaii_animals", name: "Animals", icon: "🐾" },
  { id: "glitter_sparkles", name: "Glitter", icon: "✨" },
  { id: "gems_and_ribbons", name: "Gems", icon: "🎀" },
  { id: "locks_and_keys", name: "Locks", icon: "🗝️" },
  { id: "sweet_stationery", name: "Stationery", icon: "✏️" },
  { id: "sweet_treats", name: "Sweets", icon: "🧁" },
  { id: "tactile_stationery", name: "Tape", icon: "📎" },
  { id: "tactile_charms", name: "Charms", icon: "🔮" },
  { id: "y2k_cyber", name: "Y2K", icon: "💿" },
  { id: "y2k_charms", name: "Y2K Charm", icon: "🧿" },
  { id: "chibi_characters", name: "Avatars", icon: "👧" },
  { id: "diverse_chibis", name: "Chibis", icon: "🧸" },
  { id: "doodles_and_botanicals", name: "Doodles", icon: "🌿" },
  { id: "friendship_badges", name: "Badges", icon: "🏅" },
  { id: "secret_notes", name: "Notes", icon: "💌" },
];

export const DEFAULT_STICKER_MANIFEST =
  stickerManifestJson as StickerManifest;

export type FlyoutToolPanel = {
  id: string;
  name: string;
  icon: string;
  content: ReactNode;
};

type StickerFlyoutSystemProps = {
  stickerManifest?: StickerManifest;
  onSelectSticker: (sticker: ManifestSticker) => void;
  /** Optional slot pinned above category icons (e.g. Add Snap) */
  dockHeader?: ReactNode;
  /** Extra dock tools (Frames, Paper, etc.) rendered below sticker packs */
  toolPanels?: FlyoutToolPanel[];
  className?: string;
};

export function StickerFlyoutSystem({
  stickerManifest = DEFAULT_STICKER_MANIFEST,
  onSelectSticker,
  dockHeader,
  toolPanels = [],
  className = "",
}: StickerFlyoutSystemProps) {
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      CATEGORIES.filter(
        (cat) => (stickerManifest[cat.id]?.items?.length ?? 0) > 0,
      ),
    [stickerManifest],
  );

  function toggleFolder(folderId: string) {
    setActiveTool(null);
    setActiveFolder((prev) => (prev === folderId ? null : folderId));
  }

  function toggleTool(toolId: string) {
    setActiveFolder(null);
    setActiveTool((prev) => (prev === toolId ? null : toolId));
  }

  const activeMeta = activeFolder ? stickerManifest[activeFolder] : null;
  const activeStickers = activeMeta?.items ?? [];
  const activeCat = categories.find((c) => c.id === activeFolder);
  const activeToolPanel = toolPanels.find((t) => t.id === activeTool);
  const flyoutOpen = Boolean(activeFolder || activeTool);

  return (
    <div
      className={`pointer-events-none fixed bottom-0 right-0 top-16 z-30 flex print:hidden ${className}`}
    >
      {/* 1. Flyout Palette: slides OUT TO THE LEFT */}
      <div
        className={`pointer-events-auto flex flex-col overflow-hidden rounded-l-3xl border border-pink-200 bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-300 ease-in-out ${
          flyoutOpen
            ? "w-[min(420px,calc(100vw-5.5rem))] translate-x-0 opacity-100"
            : "pointer-events-none w-0 translate-x-10 opacity-0"
        }`}
        aria-hidden={!flyoutOpen}
      >
        {flyoutOpen ? (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-pink-100 bg-pink-50/60 p-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-xl" aria-hidden>
                  {activeToolPanel?.icon ?? activeCat?.icon}
                </span>
                <span className="truncate text-sm font-extrabold capitalize text-gray-800">
                  {activeToolPanel?.name ||
                    activeMeta?.title ||
                    activeFolder?.replace(/[_-]+/g, " ")}
                </span>
                {activeFolder ? (
                  <span className="rounded-full bg-pink-200/70 px-2 py-0.5 text-xs font-semibold text-pink-700">
                    {activeStickers.length}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveFolder(null);
                  setActiveTool(null);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-pink-200 bg-white text-sm font-bold text-gray-400 transition-colors hover:bg-pink-100 hover:text-gray-700"
                aria-label="Close palette"
              >
                ✕
              </button>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-20">
              {activeToolPanel ? (
                activeToolPanel.content
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {activeStickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      type="button"
                      onClick={() => onSelectSticker(sticker)}
                      className="group flex aspect-square items-center justify-center rounded-2xl border border-pink-100 bg-pink-50/40 p-2 shadow-sm transition-transform hover:scale-110 hover:bg-pink-100/70 active:scale-95"
                      aria-label={`Place ${sticker.name}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sticker.src}
                        alt={sticker.name}
                        className="pointer-events-none max-h-full max-w-full object-contain drop-shadow-sm group-hover:drop-shadow-md"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* 2. Narrow Category Dock (fixed to screen right edge) */}
      <nav
        className="pointer-events-auto flex w-20 shrink-0 flex-col items-center gap-2 overflow-y-auto border-l border-pink-100 bg-white py-3 shadow-sm custom-scrollbar"
        aria-label="Sticker packs"
      >
        {dockHeader ? (
          <div className="mb-1 flex w-full shrink-0 flex-col items-center px-1.5">
            {dockHeader}
          </div>
        ) : null}

        {categories.map((cat) => {
          const isActive = activeFolder === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleFolder(cat.id)}
              aria-pressed={isActive}
              className={`flex h-14 w-14 flex-col items-center justify-center rounded-2xl transition-all ${
                isActive
                  ? "scale-105 bg-pink-500 text-white shadow-md"
                  : "bg-pink-50/70 text-gray-700 hover:bg-pink-100"
              }`}
            >
              <span className="mb-0.5 text-xl leading-none" aria-hidden>
                {cat.icon}
              </span>
              <span
                className={`max-w-[48px] truncate text-[9px] font-bold ${
                  isActive ? "text-white" : "text-gray-600"
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}

        {toolPanels.length > 0 ? (
          <div className="mt-2 flex w-full flex-col items-center gap-2 border-t border-pink-100 pt-2">
            {toolPanels.map((tool) => {
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => toggleTool(tool.id)}
                  aria-pressed={isActive}
                  className={`flex h-14 w-14 flex-col items-center justify-center rounded-2xl transition-all ${
                    isActive
                      ? "scale-105 bg-violet-500 text-white shadow-md"
                      : "bg-violet-50/80 text-gray-700 hover:bg-violet-100"
                  }`}
                >
                  <span className="mb-0.5 text-xl leading-none" aria-hidden>
                    {tool.icon}
                  </span>
                  <span
                    className={`max-w-[48px] truncate text-[9px] font-bold ${
                      isActive ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {tool.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </nav>
    </div>
  );
}

export default StickerFlyoutSystem;
