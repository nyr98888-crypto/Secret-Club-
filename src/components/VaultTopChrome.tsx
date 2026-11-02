"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { StealthModeToggle } from "./StealthModeToggle";
import { BackdropMagicButton } from "./BackdropColorPicker";
import { PrintExportActions } from "./PrintExportActions";
import type { BackdropTheme } from "@/lib/backdropTheme";
import { useDeviceLayout } from "@/hooks/useDeviceLayout";

type VaultTopChromeProps = {
  inviteLabel?: string;
  onInvite: () => void;
  onBookshelf: () => void;
  onLock?: () => void;
  backdropTheme: BackdropTheme;
  onBackdropChange: (theme: BackdropTheme) => void;
};

/**
 * Portals header actions.
 * Phone (<768): Bookshelf + Vibes + ••• (Print/Save, Invite, Sound, Lock).
 * Keeps the fixed 48px top bar uncluttered so it never collides with the clasp.
 */
export function VaultTopChrome({
  inviteLabel = "💌 Invite Bestie",
  onInvite,
  onBookshelf,
  onLock,
  backdropTheme,
  onBackdropChange,
}: VaultTopChromeProps) {
  const { isLandscapeBook, isPhoneChrome } = useDeviceLayout();
  const iconOnly = isPhoneChrome;
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resolve = () =>
      setHost(document.getElementById("header-actions-slot"));
    resolve();
    const t = window.setTimeout(resolve, 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(e: PointerEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (!host) return null;

  const inviteBtn = (
    <button
      type="button"
      onClick={() => {
        setMenuOpen(false);
        onInvite();
      }}
      className="flex min-h-[44px] w-full items-center gap-1 rounded-full border border-pink-300 bg-pink-50
        px-3 py-1.5 text-xs font-bold text-pink-700 shadow-sm transition hover:bg-pink-100"
      aria-label="Invite bestie and share passcode"
    >
      {inviteLabel}
    </button>
  );

  const lockBtn = onLock ? (
    <button
      type="button"
      onClick={() => {
        setMenuOpen(false);
        onLock();
      }}
      className="flex min-h-[44px] w-full items-center gap-1 rounded-full border border-slate-200 bg-white
        px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
      aria-label="Lock vault"
    >
      🔒 Lock
    </button>
  ) : null;

  return createPortal(
    <div className="print-hide flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={onBookshelf}
        className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-violet-200/80
          bg-gradient-to-r from-violet-50 to-pink-50 shadow-sm transition
          hover:from-violet-100 hover:to-pink-100
          ${iconOnly ? "min-w-[44px] text-base" : "gap-1 px-3 text-xs font-bold text-violet-700"}`}
        aria-label="Open scrapbook bookshelf"
      >
        <span aria-hidden>📚</span>
        {!iconOnly ? <span>Bookshelf</span> : null}
      </button>

      <BackdropMagicButton
        theme={backdropTheme}
        onChange={onBackdropChange}
        iconOnly={iconOnly}
      />

      {isLandscapeBook ? (
        <>
          <PrintExportActions iconOnly={false} />
          <div className="flex items-center gap-2">
            {inviteBtn}
            <StealthModeToggle />
            {onLock ? (
              <button
                type="button"
                onClick={onLock}
                className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full border border-slate-200 bg-white text-sm shadow-sm"
                aria-label="Lock vault"
              >
                🔒
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="More actions"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full border border-pink-200
              bg-white/90 text-base font-black text-pink-600 shadow-sm"
          >
            •••
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+0.4rem)] z-[90] flex w-56 flex-col gap-2
                rounded-2xl border-2 border-pink-200 bg-white/95 p-2 shadow-xl backdrop-blur-md"
            >
              <PrintExportActions iconOnly={false} className="justify-center" />
              {inviteBtn}
              <div className="px-1">
                <StealthModeToggle />
              </div>
              {lockBtn}
            </div>
          ) : null}
        </div>
      )}
    </div>,
    host,
  );
}

export default VaultTopChrome;
