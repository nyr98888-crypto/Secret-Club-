/** Canonical production origin for metadata + invite links */
export const SITE_ORIGIN = "https://www.secretclubscrapbook.com";

export const SITE_NAME = "Secret Club Scrapbook";

/** Public support inbox — use everywhere we show contact / legal email */
export const SUPPORT_EMAIL = "support@secretclubscrapbook.com";

export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;

/**
 * Public origin for outbound share links.
 * Always prefers the custom domain so invites never leak localhost / vercel.app.
 */
export function getShareOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (
    fromEnv &&
    !/localhost|127\.0\.0\.1|vercel\.app/i.test(fromEnv)
  ) {
    return fromEnv;
  }
  return SITE_ORIGIN;
}

/** Invite deep-link: /join?club=…&keys=… */
export function buildInviteShareUrl(clubId: string, passkeys: string): string {
  const origin = getShareOrigin();
  return `${origin}/join?club=${encodeURIComponent(clubId)}&keys=${encodeURIComponent(passkeys)}`;
}
