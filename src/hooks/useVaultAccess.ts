"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DrawerAsset } from "@/lib/scrapbookAssets";
import {
  AUTH_SIG_KEY,
  FREE_ITEMS_PER_PACK,
  FREE_SCRAPBOOK_LIMIT,
  FREE_SHEET_LIMIT,
  buildFreeStickerIds,
  canUseSheetPage,
  clearVaultUnlock,
  getFreeWashiIds,
  getStoredAuthSig,
  isFreeFramePreset,
  isFreeGemId,
  isFreePaper,
  isFreePokeId,
  isPremiumFramePreset,
  isPremiumPaper,
  isPremiumWashiId,
  readVaultAccess,
  unlockVault as persistUnlock,
  type VaultAccessState,
} from "@/lib/vaultAccess";

export { unlockVault } from "@/lib/vaultAccess";

const FREE_STICKER_IDS = buildFreeStickerIds();
const FREE_WASHI_IDS = getFreeWashiIds();

function syncAccess(): VaultAccessState {
  return readVaultAccess();
}

/**
 * Client vault access against `_sc_auth_sig` + vipAuth membership.
 * Free starter: 3 stickers/category, 2 frames, 2 sound charms, 5 sheets.
 * VIP: full studio + unlimited sheets.
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

  const canUseSheet = useCallback(
    (pageNumber: number) => canUseSheetPage(pageNumber, access.isVip),
    [access.isVip],
  );

  const canUsePaper = useCallback(
    (paperId: string) => {
      if (access.isVip) return true;
      if (isPremiumPaper(paperId)) return false;
      return isFreePaper(paperId);
    },
    [access.isVip],
  );

  /** All packs are browsable; free starters exist in each. */
  const canUseStickerTab = useCallback(() => true, []);

  const canUseAsset = useCallback(
    (asset: DrawerAsset) => {
      if (access.isVip) return true;
      // Magic Chest CTA is always a VIP upsell
      if (asset.id === "pack-magic-chest") return false;
      if (asset.category === "frames") {
        if (isPremiumFramePreset(asset.framePreset)) return false;
        return isFreeFramePreset(asset.framePreset);
      }
      if (asset.category === "stickers") {
        return FREE_STICKER_IDS.has(asset.id);
      }
      if (asset.category === "washi") {
        const pattern = asset.washiPatternId;
        if (pattern && isPremiumWashiId(pattern)) return false;
        return FREE_WASHI_IDS.has(asset.id);
      }
      if (asset.category === "gems") {
        return isFreeGemId(asset.id);
      }
      if (asset.category === "pokes") {
        const pokeId = asset.id.replace(/^poke-/, "");
        return isFreePokeId(pokeId);
      }
      return !asset.locked;
    },
    [access.isVip],
  );

  const withFreeTierApplied = useCallback(
    (asset: DrawerAsset): DrawerAsset => {
      if (access.isVip) {
        return { ...asset, locked: false, action: undefined };
      }
      // Freemium allow-list wins over catalog isLocked flags
      if (canUseAsset(asset)) {
        return { ...asset, locked: false, action: undefined };
      }
      return { ...asset, locked: true, action: "open-vip" };
    },
    [access.isVip, canUseAsset],
  );

  const freeStickerIds = useMemo(() => FREE_STICKER_IDS, []);

  return {
    isVip: access.isVip,
    token: access.token,
    authKey: AUTH_SIG_KEY,
    freeItemsPerPack: FREE_ITEMS_PER_PACK,
    freeSheetLimit: FREE_SHEET_LIMIT,
    freeScrapbookLimit: FREE_SCRAPBOOK_LIMIT,
    freeStickerIds,
    unlockVault,
    lockVault,
    canCreateScrapbook,
    canUseSheet,
    canUsePaper,
    canUseStickerTab,
    canUseAsset,
    withFreeTierApplied,
    refresh: () => setAccess(syncAccess()),
    getStoredAuthSig,
  };
}

export default useVaultAccess;
