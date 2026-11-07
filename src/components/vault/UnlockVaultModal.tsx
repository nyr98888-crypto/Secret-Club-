"use client";

import { useEffect, useId, useState } from "react";
import { ParentalGate } from "@/components/ParentalGate";
import { SiteLegalLinks } from "@/components/SiteLegal";
import { showVipPassToast } from "@/hooks/useVipAccess";
import { playUnlockSound } from "@/lib/audio";
import { setVaultUnlocked } from "@/lib/localClub";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";
import { activateVIPKey, isValidVipKey } from "@/lib/vipAuth";
import { unlockVault } from "@/lib/vaultAccess";

const VIP_PRICE =
  process.env.NEXT_PUBLIC_VIP_PRICE_LABEL?.trim() || "$4.99";
const LEMON_CHECKOUT =
  process.env.NEXT_PUBLIC_LEMON_CHECKOUT_URL?.trim() || "";

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: { Open: (url: string) => void };
    };
  }
}

type UnlockVaultModalProps = {
  open: boolean;
  onClose: () => void;
  onUnlocked?: () => void;
  /** Optional context headline (e.g. sheet-6 gate) */
  headline?: string;
};

/**
 * Parent-first $4.99 Bestie Vault unlock — Lemon Squeezy checkout + license restore.
 */
export function UnlockVaultModal({
  open,
  onClose,
  onUnlocked,
  headline,
}: UnlockVaultModalProps) {
  const titleId = useId();
  const [entered, setEntered] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [vipPassOpen, setVipPassOpen] = useState(false);
  const [vipPasscode, setVipPasscode] = useState("");
  const [vipPassError, setVipPassError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restoreEmail, setRestoreEmail] = useState("");
  const [restoreKey, setRestoreKey] = useState("");
  const [restoreMsg, setRestoreMsg] = useState("");

  useEffect(() => {
    if (!open) {
      setEntered(false);
      setGateOpen(false);
      setRestoreOpen(false);
      setVipPassOpen(false);
      setVipPasscode("");
      setVipPassError("");
      setError("");
      setRestoreMsg("");
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Load Lemon.js once for overlay checkout
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("lemon-squeezy-js")) {
      window.createLemonSqueezy?.();
      return;
    }
    const script = document.createElement("script");
    script.id = "lemon-squeezy-js";
    script.src = "https://assets.lemonsqueezy.com/lemon.js";
    script.defer = true;
    script.onload = () => window.createLemonSqueezy?.();
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !gateOpen && !restoreOpen && !vipPassOpen)
        onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, gateOpen, restoreOpen, vipPassOpen, onClose]);

  function claimVipPass() {
    const code = vipPasscode.trim();
    if (!code || !isValidVipKey(code)) {
      setVipPassError("Invalid passcode. Check for typos!");
      return;
    }
    const ok = activateVIPKey(code);
    if (!ok) {
      setVipPassError("Invalid passcode. Check for typos!");
      return;
    }
    setVipPassError("");
    setVaultUnlocked(true);
    try {
      playUnlockSound();
    } catch {
      /* ignore */
    }
    showVipPassToast();
    onUnlocked?.();
    setVipPassOpen(false);
    onClose();
  }

  function launchCheckout() {
    setBusy(true);
    setError("");
    try {
      window.createLemonSqueezy?.();
      if (LEMON_CHECKOUT && window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(LEMON_CHECKOUT);
        setBusy(false);
        return;
      }
      if (LEMON_CHECKOUT) {
        window.location.href = LEMON_CHECKOUT;
        return;
      }
      // Fallback: Stripe checkout session
      void (async () => {
        try {
          const res = await fetch("/api/stripe/checkout", { method: "POST" });
          const data = await res.json();
          if (!res.ok || !data.url) {
            setError(data.error || "Checkout isn’t ready yet. Try restore with a key.");
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
      })();
    } catch {
      setError("Could not open checkout. Try again.");
      setBusy(false);
      setGateOpen(false);
    }
  }

  async function restoreAccess() {
    const licenseKey = restoreKey.trim();
    if (!licenseKey || licenseKey.length < 8) {
      setRestoreMsg("Enter a valid license key (or email + key).");
      return;
    }

    // VIP passcodes restore instantly on-device (no network required)
    if (isValidVipKey(licenseKey) && activateVIPKey(licenseKey)) {
      setVaultUnlocked(true);
      try {
        playUnlockSound();
      } catch {
        /* ignore */
      }
      showVipPassToast();
      setRestoreMsg("Vault unlocked! ✨");
      onUnlocked?.();
      window.setTimeout(() => {
        setRestoreOpen(false);
        onClose();
      }, 600);
      return;
    }

    setBusy(true);
    setRestoreMsg("");
    try {
      const res = await fetch("/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey,
          email: restoreEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid || !data.token) {
        setRestoreMsg(data.error || "Couldn’t restore that license.");
        return;
      }
      unlockVault(data.token);
      setRestoreMsg("Vault unlocked! ✨");
      onUnlocked?.();
      window.setTimeout(() => {
        setRestoreOpen(false);
        onClose();
      }, 600);
    } catch {
      setRestoreMsg("Network error — try again.");
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
          className={`my-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-3xl border-4 border-white p-6 pb-6 origin-center font-toy shadow-[0_14px_0_rgba(244,114,182,0.4)] transition-all duration-300 ease-out
            ${entered ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
          style={{
            backgroundImage:
              "linear-gradient(180deg, #fff7fb 0%, #ffe4f3 45%, #e9d5ff 100%)",
            backgroundColor: "#fff7fb",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative z-[1] shrink-0 text-center">
            <h2
              id={titleId}
              className="m-0 text-2xl font-black leading-tight text-[#5b2a4a] sm:text-[1.7rem]"
            >
              💖 Unlock the Bestie Vault
            </h2>
            {headline ? (
              <p className="mt-2 text-[0.95rem] font-bold leading-snug text-[#5b2a4a]">
                {headline}
              </p>
            ) : null}
            <p className="mt-2 text-lg font-black text-[#5b2a4a]">
              {VIP_PRICE}{" "}
              <span className="text-sm font-bold text-[#8a5f7c]">
                • One-Time Purchase
              </span>
            </p>
            <p className="mt-2 inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-white bg-white/85 px-3 py-1 text-[0.7rem] font-bold text-[#5b2a4a] shadow-sm">
              <span>📱 Phone</span>
              <span aria-hidden>·</span>
              <span>📱 Tablet</span>
              <span aria-hidden>·</span>
              <span>💻 PC &amp; Mac Compatible</span>
            </p>
          </div>

          <div
            className="relative z-[1] mt-4 shrink-0 rounded-2xl border-2 p-3.5 text-left"
            style={{
              borderColor: "#a7f3d0",
              backgroundColor: "rgba(236, 253, 245, 0.92)",
            }}
          >
            <p className="m-0 text-xs font-black uppercase tracking-wide text-[#065f46]">
              🛡️ Parent Guarantee
            </p>
            <ul className="mt-2 flex list-none flex-col gap-2.5 p-0 text-[0.78rem] font-semibold leading-snug text-[#064e3b]">
              <li>
                🛡️{" "}
                <span className="font-extrabold">100% Safe &amp; Private:</span>{" "}
                No advertisements, no data tracking, and zero in-app
                subscriptions.
              </li>
              <li>
                ♾️ <span className="font-extrabold">Keep Forever:</span> Pay
                once, use on every device in your household.
              </li>
              <li>
                🤝 <span className="font-extrabold">Parent Promise:</span>{" "}
                14-day hassle-free refund if your child doesn&apos;t love it.
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
              disabled={busy}
              onClick={() => setGateOpen(true)}
              className="toy-btn w-full px-5 py-4 text-base text-white disabled:opacity-60 sm:text-lg"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #f472b6 0%, #e879f9 50%, #a78bfa 100%)",
                backgroundColor: "#f472b6",
              }}
            >
              {busy
                ? "Opening checkout…"
                : `Unlock Full Studio for ${VIP_PRICE}`}
            </button>

            <button
              type="button"
              className="text-sm font-bold text-[#8a5f7c] underline-offset-2 hover:underline"
              onClick={() => {
                setRestoreOpen(true);
                setRestoreMsg("");
              }}
            >
              Already purchased? Enter your email or key to restore
            </button>

            {!vipPassOpen ? (
              <button
                type="button"
                className="text-xs font-semibold text-[#a78bfa] underline-offset-2 hover:underline"
                onClick={() => {
                  setVipPassOpen(true);
                  setVipPassError("");
                }}
              >
                Have a VIP Pass?
              </button>
            ) : (
              <div className="w-full rounded-2xl border border-pink-100 bg-white/70 p-3 text-left">
                <label className="block text-[0.65rem] font-bold uppercase tracking-wide text-[#8a5f7c]">
                  VIP Passcode
                  <input
                    type="text"
                    value={vipPasscode}
                    onChange={(e) => {
                      setVipPasscode(e.target.value);
                      setVipPassError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        claimVipPass();
                      }
                    }}
                    className="mt-1 w-full rounded-xl border-2 border-pink-100 px-3 py-2 text-sm font-semibold text-[#5b2a4a]"
                    placeholder="Enter VIP Passcode"
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
                {vipPassError ? (
                  <p className="mt-1.5 text-xs font-semibold text-[#d62839]">
                    {vipPassError}
                  </p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-full border border-slate-200 py-2 text-xs font-bold text-slate-600"
                    onClick={() => {
                      setVipPassOpen(false);
                      setVipPasscode("");
                      setVipPassError("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full py-2 text-xs font-black text-white"
                    style={{ backgroundColor: "#a78bfa" }}
                    onClick={claimVipPass}
                  >
                    Claim
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              className="text-sm font-semibold text-[#8a5f7c]"
              onClick={onClose}
            >
              Maybe Later
            </button>

            <p className="mt-1 text-center text-[0.7rem] font-semibold text-[#8a5f7c]">
              Questions?{" "}
              <a
                href={SUPPORT_MAILTO}
                className="font-bold text-pink-600 underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
            <SiteLegalLinks className="mt-1" />
          </div>
        </div>
      </div>

      <ParentalGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onUnlocked={launchCheckout}
        priceLabel={VIP_PRICE}
      />

      {restoreOpen ? (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Restore purchase"
          onClick={() => setRestoreOpen(false)}
        >
          <div
            className="my-auto flex max-h-[90vh] w-full max-w-sm flex-col overflow-y-auto rounded-3xl border-4 border-white bg-white p-6 pb-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 shrink-0 text-lg font-black text-[#5b2a4a]">
              Restore your unlock
            </h3>
            <p className="mt-1 shrink-0 text-xs font-semibold text-[#8a5f7c]">
              Paste the license key from your receipt. Email is optional.
            </p>
            <label className="mt-3 block shrink-0 text-[0.65rem] font-bold uppercase tracking-wide text-[#8a5f7c]">
              Email (optional)
              <input
                type="email"
                value={restoreEmail}
                onChange={(e) => setRestoreEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-pink-100 px-3 py-2 text-sm font-semibold text-[#5b2a4a]"
                placeholder="parent@email.com"
              />
            </label>
            <label className="mt-3 block shrink-0 text-[0.65rem] font-bold uppercase tracking-wide text-[#8a5f7c]">
              License key
              <input
                type="text"
                value={restoreKey}
                onChange={(e) => setRestoreKey(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-pink-100 px-3 py-2 text-sm font-semibold text-[#5b2a4a]"
                placeholder="scvip_… or store key"
                autoFocus
              />
            </label>
            {restoreMsg ? (
              <p className="mt-2 shrink-0 text-sm font-bold text-[#5b2a4a]">
                {restoreMsg}
              </p>
            ) : null}
            <div className="mt-4 flex shrink-0 gap-2 pb-6">
              <button
                type="button"
                className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-bold text-slate-600"
                onClick={() => setRestoreOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-full py-2.5 text-sm font-black text-white disabled:opacity-60"
                style={{ backgroundColor: "#ec4899" }}
                onClick={() => void restoreAccess()}
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default UnlockVaultModal;
