/**
 * Promo / friend VIP passphrases accepted by /api/license/verify restore.
 * Case-insensitive match; keep these out of public marketing copy.
 */
export const VIP_TOKENS = [
  "sc-master-admin-01", // Your test key
  "sc-vip-maya-berry", // Friend (Owner)
  "sc-vip-sparkle-gem", // Bestie 1
  "sc-vip-glitter-star", // Bestie 2
  "sc-vip-sweet-charm", // Bestie 3
] as const;

export type VipToken = (typeof VIP_TOKENS)[number];

const VIP_TOKEN_SET = new Set(
  VIP_TOKENS.map((t) => t.trim().toLowerCase()),
);

/** Returns true when `input` matches a known VIP pass (case-insensitive). */
export function isVipPassToken(input: string): boolean {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return false;
  return VIP_TOKEN_SET.has(normalized);
}
