/**
 * Single-device VIP passcodes for Bestie Vault unlock.
 * Keep keys private — do not put them in public marketing copy.
 */

/** Three distinct single-device VIP keys */
export const VIP_KEYS = [
  "BESTIE-VIP-01",
  "BESTIE-VIP-02",
  "BESTIE-VIP-03",
] as const;

export const VALID_VIP_KEY_LIST = VIP_KEYS;

export const VALID_VIP_KEYS = new Set(
  VIP_KEYS.map((k) => k.trim().toLowerCase()),
);

/** Persistent device flag — bypasses $4.99 paywalls when `"true"` */
export const DEVICE_VIP_UNLOCK_KEY = "secret_club_vip_unlocked";

/** Canonical claimed key stored on this device */
export const CLAIMED_VIP_KEY = "secret_club_claimed_key";

export const VIP_STORAGE_KEY = "sc_vip_membership_v1";

/** Legacy flags kept in sync for older builds / vaultAccess readers */
const LEGACY_VIP_UNLOCK_FLAG = "sc_vip_unlocked";
const LEGACY_VIP_ASSIGNED_KEY = "sc_assigned_key";

export const VIP_PASS_TOAST =
  "✨ VIP Pass Activated! Welcome to the Secret Club! ✨";

/** Resolve input to the canonical VIP_KEYS entry (case-insensitive, trimmed). */
export function matchVipKey(input: string): string | null {
  const clean = input.trim().toLowerCase();
  if (!clean) return null;
  const matched = VIP_KEYS.find((k) => k.toLowerCase() === clean);
  return matched ?? null;
}

export function isValidVipKey(key: string): boolean {
  return matchVipKey(key) !== null;
}

export function checkIsVIP(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(DEVICE_VIP_UNLOCK_KEY) === "true") return true;
    const stored = localStorage.getItem(VIP_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as { unlocked?: boolean };
      if (data && data.unlocked === true) return true;
    }
    // Legacy device flag from earlier VIP pass flow
    return localStorage.getItem(LEGACY_VIP_UNLOCK_FLAG) === "true";
  } catch {
    return false;
  }
}

export function activateVIPKey(key: string): boolean {
  if (typeof window === "undefined") return false;
  const matchedKey = matchVipKey(key);
  if (!matchedKey) return false;

  try {
    localStorage.setItem(DEVICE_VIP_UNLOCK_KEY, "true");
    localStorage.setItem(CLAIMED_VIP_KEY, matchedKey);
    localStorage.setItem(
      VIP_STORAGE_KEY,
      JSON.stringify({
        unlocked: true,
        activatedAt: new Date().toISOString(),
        key: matchedKey,
      }),
    );
    localStorage.setItem(LEGACY_VIP_UNLOCK_FLAG, "true");
    localStorage.setItem(LEGACY_VIP_ASSIGNED_KEY, matchedKey);
    window.dispatchEvent(new CustomEvent("sc:vault-unlocked"));
    return true;
  } catch {
    return false;
  }
}

export function clearVIPMembership(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DEVICE_VIP_UNLOCK_KEY);
    localStorage.removeItem(CLAIMED_VIP_KEY);
    localStorage.removeItem(VIP_STORAGE_KEY);
    localStorage.removeItem(LEGACY_VIP_UNLOCK_FLAG);
    localStorage.removeItem(LEGACY_VIP_ASSIGNED_KEY);
  } catch {
    /* ignore */
  }
}
