"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isVipPassToken } from "@/config/vipPasses";
import { setVaultUnlocked } from "@/lib/localClub";
import {
  readVaultAccess,
  unlockVault,
  VIP_ASSIGNED_KEY,
  VIP_UNLOCK_FLAG,
} from "@/lib/vaultAccess";

export { VIP_UNLOCK_FLAG, VIP_ASSIGNED_KEY };

function readLocalVipFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(VIP_UNLOCK_FLAG) === "true";
  } catch {
    return false;
  }
}

/** Sync check — safe in render / click handlers */
export function isVipUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return readVaultAccess().isVip || readLocalVipFlag();
}

/**
 * Reactive VIP unlock state for sticker / pack gating.
 * Does not read URL params (safe outside Suspense).
 *
 * Usage:
 *   const { isUnlocked } = useVipAccess();
 *   const isLocked = !isUnlocked() && pack.isPremium;
 */
export function useVipAccess() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    function sync() {
      setUnlocked(isVipUnlocked());
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sc:vault-unlocked", sync);
    window.addEventListener("sc:vault-locked", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sc:vault-unlocked", sync);
      window.removeEventListener("sc:vault-locked", sync);
    };
  }, []);

  const isUnlocked = useCallback(() => isVipUnlocked(), [unlocked]);

  return { isUnlocked, isVip: unlocked };
}

/**
 * Consumes `?key=` promo passes once. Mount only inside Suspense
 * (see VipAccessBootstrap).
 */
export function useVipKeyFromUrl() {
  const searchParams = useSearchParams();
  const { isUnlocked, isVip } = useVipAccess();

  useEffect(() => {
    const key = searchParams.get("key");
    if (!key || !isVipPassToken(key)) return;

    let cancelled = false;

    void (async () => {
      try {
        // Persist VIP + skip the 3-key passcode / secret room on this device
        localStorage.setItem(VIP_UNLOCK_FLAG, "true");
        localStorage.setItem(VIP_ASSIGNED_KEY, key);
        setVaultUnlocked(true);

        const res = await fetch("/api/license/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ licenseKey: key }),
        });
        const data = (await res.json()) as { token?: string };

        if (cancelled) return;

        if (res.ok && data.token) {
          try {
            unlockVault(data.token);
          } catch {
            window.dispatchEvent(new CustomEvent("sc:vault-unlocked"));
          }
        } else {
          window.dispatchEvent(new CustomEvent("sc:vault-unlocked"));
        }
      } catch {
        if (!cancelled) {
          setVaultUnlocked(true);
          window.dispatchEvent(new CustomEvent("sc:vault-unlocked"));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return { isUnlocked, isVip };
}

export default useVipAccess;
