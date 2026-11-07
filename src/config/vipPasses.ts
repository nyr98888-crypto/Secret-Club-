/**
 * Promo / friend VIP passphrases accepted by /api/license/verify restore.
 * Source of truth: src/lib/vipAuth.ts
 */
import {
  isValidVipKey,
  VIP_KEYS,
  VALID_VIP_KEY_LIST,
} from "@/lib/vipAuth";

export { VIP_KEYS };

export const VIP_TOKENS = VALID_VIP_KEY_LIST;

export type VipToken = (typeof VIP_TOKENS)[number];

/** Returns true when `input` matches a known VIP pass (case-insensitive). */
export function isVipPassToken(input: string): boolean {
  return isValidVipKey(input);
}
