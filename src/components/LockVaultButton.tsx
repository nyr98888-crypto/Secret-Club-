"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type LockVaultButtonProps = {
  onLock: () => void;
};

/**
 * Portals into the fixed top-chrome cluster beside Sound.
 */
export function LockVaultButton({ onLock }: LockVaultButtonProps) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setHost(document.getElementById("top-chrome-slot"));
  }, []);

  function handleClick() {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => onLock(), 420);
  }

  if (!host) return null;

  return createPortal(
    <button
      type="button"
      onClick={handleClick}
      disabled={closing}
      aria-label="Lock vault and return to cover"
      className="flex items-center gap-1 rounded-full border border-pink-300 bg-pink-100 px-3 py-1.5
        text-xs font-bold text-pink-700 shadow-sm transition hover:bg-pink-200
        min-h-[48px] disabled:opacity-60"
    >
      🔒 Lock Vault
    </button>,
    host,
  );
}

export default LockVaultButton;
