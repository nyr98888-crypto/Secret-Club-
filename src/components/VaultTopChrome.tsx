"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StealthModeToggle } from "./StealthModeToggle";
import { BackdropMagicButton } from "./BackdropColorPicker";
import type { BackdropTheme } from "@/lib/backdropTheme";

type VaultTopChromeProps = {
  inviteLabel?: string;
  onInvite: () => void;
  onBookshelf: () => void;
  onLock?: () => void;
  backdropTheme: BackdropTheme;
  onBackdropChange: (theme: BackdropTheme) => void;
};

/**
 * Portals Invite + Bookshelf + Lock + Room Vibes + Sound into the vault header.
 */
export function VaultTopChrome({
  inviteLabel = "💌 Invite Bestie",
  onInvite,
  onBookshelf,
  onLock,
  backdropTheme,
  onBackdropChange,
}: VaultTopChromeProps) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const resolve = () =>
      setHost(document.getElementById("header-actions-slot"));
    resolve();
    const t = window.setTimeout(resolve, 0);
    return () => window.clearTimeout(t);
  }, []);

  if (!host) return null;

  return createPortal(
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={onInvite}
        className="flex min-h-[40px] items-center gap-1 rounded-full border border-pink-300 bg-pink-50
          px-3 py-1.5 text-xs font-bold text-pink-700 shadow-sm transition hover:bg-pink-100"
        aria-label="Invite bestie and share passcode"
      >
        {inviteLabel}
      </button>
      <button
        type="button"
        onClick={onBookshelf}
        className="flex min-h-[40px] items-center gap-1 rounded-full border border-violet-200/80
          bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-1.5 text-xs font-bold text-violet-700
          shadow-sm transition hover:from-violet-100 hover:to-pink-100"
        aria-label="Open scrapbook bookshelf"
      >
        📚 Bookshelf
      </button>
      {onLock ? (
        <button
          type="button"
          disabled={closing}
          onClick={() => {
            if (closing) return;
            setClosing(true);
            window.setTimeout(() => {
              onLock();
              setClosing(false);
            }, 280);
          }}
          className="flex min-h-[40px] items-center gap-1 rounded-full border border-pink-200 bg-pink-100
            px-3 py-1.5 text-xs font-bold text-pink-700 shadow-sm transition hover:bg-pink-200 disabled:opacity-60"
          aria-label="Lock vault and return to secret room"
        >
          🔒 Lock Vault
        </button>
      ) : null}
      <BackdropMagicButton theme={backdropTheme} onChange={onBackdropChange} />
      <StealthModeToggle />
    </div>,
    host,
  );
}

export default VaultTopChrome;
