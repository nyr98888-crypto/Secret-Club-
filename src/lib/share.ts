import { buildInviteShareUrl, getShareOrigin } from "@/lib/site";

export type SharePayload = {
  title?: string;
  text: string;
  url?: string;
};

export { buildInviteShareUrl, getShareOrigin };

export async function nativeShare(
  payload: SharePayload,
): Promise<"shared" | "copied" | "cancelled"> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
      return "shared";
    } catch (err) {
      if ((err as Error).name === "AbortError") return "cancelled";
    }
  }

  const full = payload.url
    ? `${payload.text}${payload.text.includes(payload.url) ? "" : `\n${payload.url}`}`
    : payload.text;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(full);
    return "copied";
  }

  // Last resort: WhatsApp / SMS deep links on mobile
  const wa = `https://wa.me/?text=${encodeURIComponent(full)}`;
  window.open(wa, "_blank");
  return "shared";
}

export function askFounderMessage(clubName: string, vaultUrl: string) {
  return `Hey! I'm locked out of ${clubName}. What was our 3-key passcode again? 🔑 ${vaultUrl}`;
}

export function inviteMessage(clubName: string, vaultUrl: string) {
  return `You're invited into ${clubName}. Open the vault — you'll need our 3-key passcode. ${vaultUrl}`;
}

export function dropMessage(vaultDropUrl: string) {
  return `New drop locked in the vault. ${vaultDropUrl}`;
}

/** Build the friend invite payload for Web Share / clipboard */
export function buildClubInviteShare(input: {
  clubName: string;
  clubId: string;
  passcode: string[];
}) {
  const keys = input.passcode.join(" ");
  const shareUrl = getShareOrigin();
  const text = [
    `You're invited to my Secret Club: ${input.clubName}! 🎀✨`,
    `Our secret keys: ${keys}`,
    `Open our diary here: ${shareUrl}`,
  ].join("\n");
  return {
    title: "Join my Secret Club! 🍓",
    text,
    url: shareUrl,
  };
}
