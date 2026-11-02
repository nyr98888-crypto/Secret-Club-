"use client";

import { useEffect, useId, useState } from "react";
import { ParentalGate } from "./ParentalGate";

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
 * Price-agnostic Magic Chest VIP upgrade.
 * Checkout amount lives only on Stripe — never shown in this UI.
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
        className="fixed inset-0 z-[90] grid place-items-center bg-[rgba(60,20,50,0.5)] p-4 backdrop-blur-[3px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={onClose}
      >
        <div
          className={`w-full max-w-md origin-center font-toy transition-all duration-300 ease-out
            ${entered ? "scale-100 rotate-0 opacity-100" : "scale-95 rotate-[-2deg] opacity-0"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative overflow-hidden rounded-[2rem] border-4 border-white
              bg-gradient-to-b from-[#fff7fb] via-[#ffe4f3] to-[#e9d5ff]
              p-5 shadow-[0_14px_0_rgba(244,114,182,0.4)] sm:p-6"
          >
            {/* Sparkle deco */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-yellow-200/50 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-pink-300/40 blur-2xl"
            />

            <div className="relative z-[1] text-center">
              <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl border-4 border-white
                bg-gradient-to-br from-amber-200 via-pink-300 to-violet-300 text-3xl
                shadow-[0_6px_0_rgba(244,114,182,0.35)]">
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
            </div>

            <ul className="relative z-[1] mt-5 space-y-2.5">
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

            {/* Parent Safety Guarantee */}
            <div className="relative z-[1] mt-4 flex flex-col gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 p-3.5 text-left">
              <p className="m-0 text-xs font-bold uppercase tracking-wide text-emerald-800">
                🛡️ Parent Safety Guarantee
              </p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[0.78rem] font-semibold leading-snug text-emerald-900/90">
                <li>
                  ✅ <span className="font-extrabold">Works 100% Offline &amp; Locally:</span>{" "}
                  No constant internet connection needed once loaded. Scrapbooks
                  live right on your device.
                </li>
                <li>
                  ✅ <span className="font-extrabold">Zero Stranger Contact:</span>{" "}
                  No public discovery feeds, no open chatrooms, and no search
                  algorithms.
                </li>
                <li>
                  ✅ <span className="font-extrabold">Privacy First:</span> Zero
                  personal data collection, zero tracking cookies, and no kid
                  email/phone accounts required.
                </li>
                <li>
                  ✅ <span className="font-extrabold">No Ad Traps:</span> 100%
                  ad-free forever. One simple unlock, zero recurring
                  microtransactions or countdown clocks.
                </li>
              </ul>
            </div>

            {error ? (
              <p className="relative z-[1] mt-3 text-center text-sm font-semibold text-[#d62839]">
                {error}
              </p>
            ) : null}

            <div className="relative z-[1] mt-5 flex flex-col items-center gap-3">
              <button
                type="button"
                className="toy-btn w-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-400
                  px-5 py-4 text-lg text-white disabled:opacity-60"
                disabled={busy}
                onClick={() => setGateOpen(true)}
              >
                {busy ? "Opening checkout…" : "Unlock Full Vault ✨"}
              </button>
              <button
                type="button"
                className="text-sm font-semibold text-[#8a5f7c] underline-offset-2 hover:underline"
                onClick={onClose}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>

      <ParentalGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onUnlocked={startCheckout}
      />
    </>
  );
}

export default VipUpgradeModal;
