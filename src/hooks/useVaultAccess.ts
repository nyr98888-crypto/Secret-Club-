"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { STICKERS } from "@/constants/stickers";
import type { DrawerAsset } from "@/lib/scrapbookAssets";
import {
  AUTH_SIG_KEY,
  FREE_SCRAPBOOK_LIMIT,
  FREE_STICKER_LIMIT,
  clearVaultUnlock,
  getStoredAuthSig,
  isFreeFramePreset,
  isFreePaper,
  isVipCategory,
  isVipStickerTab,
  readVaultAccess,
  unlockVault as persistUnlock,
  type VaultAccessState,
} from "@/lib/vaultAccess";

export { unlockVault } from "@/lib/vaultAccess";

const FREE_STICKER_IDS = new Set(
  STICKERS.slice(0, FREE_STICKER_LIMIT).map((s) => s.id),
);

function syncAccess(): VaultAccessState {
  return readVaultAccess();
}

/**
 * Client vault access against `_sc_auth_sig`.
 * Free tier: 25 stickers, 3 papers, 2 polaroids, 1 scrapbook.
 * VIP: full studio (gems, charms, washi, premium frames, unlimited books).
 */
export function useVaultAccess() {
  const [access, setAccess] = useState<VaultAccessState>(() => ({
    isVip: false,
    token: null,
  }));

  useEffect(() => {
    setAccess(syncAccess());
    function refresh() {
      setAccess(syncAccess());
    }
    window.addEventListener("storage", refresh);
    window.addEventListener("sc:vault-unlocked", refresh);
    window.addEventListener("sc:vault-locked", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("sc:vault-unlocked", refresh);
      window.removeEventListener("sc:vault-locked", refresh);
    };
  }, []);

  const unlockVault = useCallback((token: string) => {
    persistUnlock(token);
    setAccess(syncAccess());
  }, []);

  const lockVault = useCallback(() => {
    clearVaultUnlock();
    setAccess(syncAccess());
  }, []);

  const canCreateScrapbook = useCallback(
    (currentCount: number) => {
      if (access.isVip) return true;
      return currentCount < FREE_SCRAPBOOK_LIMIT;
    },
    [access.isVip],
  );

  const canUsePaper = useCallback(
    (paperId: string) => access.isVip || isFreePaper(paperId),
    [access.isVip],
  );

  const canUseStickerTab = useCallback(
    (tabId: string) => access.isVip || !isVipStickerTab(tabId),
    [access.isVip],
  );

  const canUseAsset = useCallback(
    (asset: DrawerAsset) => {
      if (access.isVip) return true;
      if (asset.locked || asset.action === "open-vip") return false;
      if (isVipCategory(asset.category)) return false;
      if (asset.category === "frames") {
        return isFreeFramePreset(asset.framePreset);
      }
      if (asset.category === "stickers") {
        return FREE_STICKER_IDS.has(asset.id);
      }
      return true;
    },
    [access.isVip],
  );

  const withFreeTierApplied = useCallback(
    (asset: DrawerAsset): DrawerAsset => {
      if (access.isVip) return { ...asset, locked: asset.locked ?? false };
      const allowed = canUseAsset({ ...asset, locked: false, action: undefined });
      if (allowed) return { ...asset, locked: false, action: undefined };
      return { ...asset, locked: true, action: "open-vip" };
    },
    [access.isVip, canUseAsset],
  );

  const freeStickerIds = useMemo(() => FREE_STICKER_IDS, []);

  return {
    isVip: access.isVip,
    token: access.token,
    authKey: AUTH_SIG_KEY,
    freeStickerLimit: FREE_STICKER_LIMIT,
    freeScrapbookLimit: FREE_SCRAPBOOK_LIMIT,
    freeStickerIds,
    unlockVault,
    lockVault,
    canCreateScrapbook,
    canUsePaper,
    canUseStickerTab,
    canUseAsset,
    withFreeTierApplied,
    refresh: () => setAccess(syncAccess()),
    /** Re-read raw storage (for tests / debugging) */
    getStoredAuthSig,
  };
}

export default useVaultAccess;
