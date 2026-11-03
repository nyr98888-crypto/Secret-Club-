"use client";

import { useEffect, useId, useState } from "react";
import { ParentalGate } from "./ParentalGate";
import { SiteLegalLinks } from "@/components/SiteLegal";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";

const VIP_PRICE =
  process.env.NEXT_PUBLIC_VIP_PRICE_LABEL?.trim() || "$4.99";

const FEATURES = [
  "💖 500+ Exclusive Squad Stickers & Mascot Decos",
  "📸 All Holographic Frames & Glitter Toploaders",
  "🎀 Rare Rainbow Washi Tapes & Sparkle Gem Packs",
  "🔔 Rare Sound Chimes & Secret Charm Badges",
  "🦄 Unlimited Squad Vaults on your Bookshelf",
] as const;

type VipUpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  /** Optional hook after checkout session is created / redirect begins */
  onCheckoutStart?: () => void;
};

/**
 * $4.99 one-time Parent Guarantee checkout for the Magic Chest VIP unlock.
 */
export function VipUpgradeModal({
  open,
  onClose,
  onCheckoutStart,
}: VipUpgradeModalProps) {
  const titleId = useId();
  const [entered, setEntered] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setEntered(false);
      setGateOpen(false);
      setError("");
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !gateOpen) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, gateOpen, onClose]);

  async function startCheckout() {
    setBusy(true);
    setError("");
    onCheckoutStart?.();
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Could not open checkout. Try again.");
        setGateOpen(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not open checkout. Try again.");
      setGateOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={onClose}
      >
        <div
          className={`relative my-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-3xl border-4 border-white
            bg-gradient-to-b from-[#fff7fb] via-[#ffe4f3] to-[#e9d5ff]
            p-6 pb-6 origin-center font-toy shadow-[0_14px_0_rgba(244,114,182,0.4)] transition-all duration-300 ease-out
            ${entered ? "scale-100 rotate-0 opacity-100" : "scale-95 rotate-[-2deg] opacity-0"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#fef08a]/50 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-[#f9a8d4]/40 blur-2xl"
          />

          <div className="relative z-[1] shrink-0 text-center">
            <div
              className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl border-4 border-white
              text-3xl shadow-[0_6px_0_rgba(244,114,182,0.35)]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #fde68a 0%, #f9a8d4 50%, #c4b5fd 100%)",
                backgroundColor: "#f9a8d4",
              }}
            >
              🎁
            </div>
            <h2
              id={titleId}
              className="m-0 text-2xl font-bold leading-tight text-[#5b2a4a] sm:text-[1.65rem]"
            >
              ✨ Unlock the Magic Chest ✨
            </h2>
            <p className="mx-auto mt-2 max-w-[34ch] text-sm font-medium leading-relaxed text-[#8a5f7c] sm:text-base">
              Unlock exclusive stickers, holographic frames, sparkle gems, and
              rare sound charms for your scrapbook!
            </p>

            {/* Clear one-time price for parents */}
            <div className="mx-auto mt-4 inline-flex flex-col items-center rounded-2xl border-2 border-white bg-white/90 px-5 py-3 shadow-sm">
              <span className="text-[0.65rem] font-black uppercase tracking-wider text-[#8a5f7c]">
                One-time Parent Unlock
              </span>
              <span className="text-3xl font-black tracking-tight text-[#5b2a4a]">
                {VIP_PRICE}
              </span>
              <span className="text-[0.7rem] font-bold text-emerald-700">
                Lifetime · No subscription · No ads
              </span>
            </div>
          </div>

          <ul className="relative z-[1] mt-5 shrink-0 space-y-2.5">
            {FEATURES.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 rounded-2xl border-2 border-white/80 bg-white/70 px-3 py-2.5
                  text-left text-sm font-semibold text-[#5b2a4a] shadow-sm"
              >
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>

          <div className="relative z-[1] mt-4 flex shrink-0 flex-col gap-2 rounded-2xl border-2 border-[#a7f3d0] bg-[#ecfdf5]/90 p-3.5 text-left">
            <p className="m-0 text-xs font-bold uppercase tracking-wide text-[#065f46]">
              🛡️ Parent Safety Guarantee
            </p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[0.78rem] font-semibold leading-snug text-[#064e3b]/90">
              <li>
                ✅{" "}
                <span className="font-extrabold">
                  Works 100% Offline &amp; Locally:
                </span>{" "}
                Scrapbooks live on your device — no constant internet needed once
                loaded.
              </li>
              <li>
                ✅{" "}
                <span className="font-extrabold">Zero Stranger Contact:</span> No
                public feeds, open chatrooms, or discovery algorithms.
              </li>
              <li>
                ✅ <span className="font-extrabold">Privacy First:</span> Zero kid
                accounts, zero tracking cookies, no email/phone required.
              </li>
              <li>
                ✅ <span className="font-extrabold">No Ad Traps:</span> One{" "}
                {VIP_PRICE} unlock. Zero recurring charges or countdown clocks.
              </li>
            </ul>
          </div>

          {error ? (
            <p className="relative z-[1] mt-3 shrink-0 text-center text-sm font-semibold text-[#d62839]">
              {error}
            </p>
          ) : null}

          <div className="relative z-[1] mt-5 flex shrink-0 flex-col items-center gap-3 pb-6">
            <button
              type="button"
              className="toy-btn w-full px-5 py-4 text-lg text-white disabled:opacity-60"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #f472b6 0%, #e879f9 50%, #a78bfa 100%)",
                backgroundColor: "#f472b6",
              }}
              disabled={busy}
              onClick={() => setGateOpen(true)}
            >
              {busy ? "Opening checkout…" : `Unlock for ${VIP_PRICE} ✨`}
            </button>
            <p className="m-0 text-center text-[0.65rem] font-semibold text-[#8a5f7c]">
              Grown-ups verify next, then Stripe Checkout opens securely.
            </p>
            <button
              type="button"
              className="text-sm font-semibold text-[#8a5f7c] underline-offset-2 hover:underline"
              onClick={onClose}
            >
              Maybe Later
            </button>
            <p className="m-0 text-center text-[0.7rem] font-semibold text-[#8a5f7c]">
              Support:{" "}
              <a
                href={SUPPORT_MAILTO}
                className="font-bold text-pink-600 underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
            <SiteLegalLinks />
          </div>
        </div>
      </div>

      <ParentalGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onUnlocked={startCheckout}
        priceLabel={VIP_PRICE}
      />
    </>
  );
}

export default VipUpgradeModal;
