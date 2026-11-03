/**
 * Promo / friend VIP passphrases accepted by /api/license/verify restore.
 * Case-insensitive match; keep these out of public marketing copy.
 */
export const VIP_TOKENS = [
  "founder-secret-access", // Your test key
  "strawberry-sparkle-club", // Key 1 (Your friend)
  "pink-crystal-bestie", // Key 2 (Bestie 1)
  "golden-charm-vault", // Key 3 (Bestie 2)
  "glitter-ribbon-pass", // Key 4 (Bestie 3)
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
