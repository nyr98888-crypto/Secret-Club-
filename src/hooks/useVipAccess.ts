"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  activateVIPKey,
  checkIsVIP,
  isValidVipKey,
  VIP_PASS_TOAST,
} from "@/lib/vipAuth";
import { setVaultUnlocked } from "@/lib/localClub";
import {
  readVaultAccess,
  VIP_ASSIGNED_KEY,
  VIP_UNLOCK_FLAG,
} from "@/lib/vaultAccess";

export { VIP_UNLOCK_FLAG, VIP_ASSIGNED_KEY };

const VIP_TOAST_EVENT = "sc:vip-pass-toast";

/** Sync check — safe in render / click handlers */
export function isVipUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return readVaultAccess().isVip || checkIsVIP();
}

/** Show the VIP congratulations toast anywhere in the app */
export function showVipPassToast(message: string = VIP_PASS_TOAST) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(VIP_TOAST_EVENT, { detail: { message } }),
  );
}

export function subscribeVipPassToast(
  handler: (message: string) => void,
): () => void {
  function onToast(e: Event) {
    const detail = (e as CustomEvent<{ message?: string }>).detail;
    handler(detail?.message || VIP_PASS_TOAST);
  }
  window.addEventListener(VIP_TOAST_EVENT, onToast);
  return () => window.removeEventListener(VIP_TOAST_EVENT, onToast);
}

/** Strip `vip` query param without a full navigation reload */
function cleanVipQueryParams() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("vip")) return;
    url.searchParams.delete("vip");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  } catch {
    /* ignore */
  }
}

/**
 * Reactive VIP unlock state for sticker / pack gating.
 * Does not read URL params (safe outside Suspense).
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
 * Consumes `?vip=` single-device passes once. Mount only inside Suspense
 * (see VipAccessBootstrap).
 */
export function useVipKeyFromUrl() {
  const searchParams = useSearchParams();
  const { isUnlocked, isVip } = useVipAccess();

  useEffect(() => {
    const raw = searchParams.get("vip");
    if (!raw || !isValidVipKey(raw)) return;

    const ok = activateVIPKey(raw);
    if (!ok) return;

    setVaultUnlocked(true);
    cleanVipQueryParams();
    showVipPassToast();
  }, [searchParams]);

  return { isUnlocked, isVip };
}

export default useVipAccess;
