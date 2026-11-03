"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { SITE_NAME, SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";

export type LegalDoc = "terms" | "privacy";

type LegalModalProps = {
  doc: LegalDoc | null;
  onClose: () => void;
};

function SupportLink({ className = "" }: { className?: string }) {
  return (
    <a
      href={SUPPORT_MAILTO}
      className={`font-bold text-pink-600 underline-offset-2 hover:underline ${className}`}
    >
      {SUPPORT_EMAIL}
    </a>
  );
}

function TermsBody() {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-wide text-[#8a5f7c]">
        Last updated: November 2026
      </p>
      <ol className="mt-4 flex list-decimal flex-col gap-3 pl-4 text-sm font-semibold leading-relaxed text-[#5b2a4a]">
        <li>
          <span className="font-extrabold">Digital product.</span> {SITE_NAME}{" "}
          provides a private digital scrapbook experience. A Bestie Vault
          purchase unlocks premium stickers, sheets, and studio features
          immediately after checkout.
        </li>
        <li>
          <span className="font-extrabold">Parent refund promise.</span> If your
          child doesn&apos;t love it, contact us within 14 days of purchase at{" "}
          <SupportLink /> for a hassle-free refund.
        </li>
        <li>
          <span className="font-extrabold">License.</span> Your one-time purchase
          grants a personal, non-exclusive, non-transferable lifetime license for
          household devices (phone, tablet, and computer).
        </li>
        <li>
          <span className="font-extrabold">Acceptable use.</span> Use the app for
          personal, family-friendly scrapbooking. Do not abuse the service,
          attempt to reverse-engineer paid unlocks, or use it for harmful
          content.
        </li>
        <li>
          <span className="font-extrabold">Disclaimer.</span> The software is
          provided &quot;as is.&quot; We are not responsible for device
          compatibility issues beyond reasonable support help at <SupportLink />.
        </li>
        <li>
          <span className="font-extrabold">Contact.</span> Questions about these
          terms, billing, or access: <SupportLink />.
        </li>
      </ol>
    </>
  );
}

function PrivacyBody() {
  return (
    <>
      <p className="text-sm font-semibold leading-relaxed text-[#5b2a4a]">
        {SITE_NAME} is built for private, kid-friendly scrapbooking.
      </p>
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#8a5f7c]">
        Last updated: November 2026
      </p>
      <ul className="mt-4 flex list-disc flex-col gap-3 pl-4 text-sm font-semibold leading-relaxed text-[#5b2a4a]">
        <li>
          <span className="font-extrabold">Local-first scrapbooks.</span> Photos,
          stickers, and diary pages live primarily on your device. We do not sell
          kids&apos; content or run ad trackers in the studio.
        </li>
        <li>
          <span className="font-extrabold">Purchases.</span> Checkout is handled
          by our payment partner. We only store what we need to verify a Bestie
          Vault license.
        </li>
        <li>
          <span className="font-extrabold">Optional restore email.</span> If you
          enter an email when restoring a purchase, it is used only to match
          your license — not for marketing lists.
        </li>
        <li>
          <span className="font-extrabold">Parents &amp; guardians.</span> For
          privacy questions, data requests, or COPPA-related concerns, email{" "}
          <SupportLink />.
        </li>
        <li>
          <span className="font-extrabold">Contact.</span> Privacy inbox:{" "}
          <SupportLink />.
        </li>
      </ul>
    </>
  );
}

export function LegalModal({ doc, onClose }: LegalModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!doc) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, onClose]);

  if (!mounted || !doc) return null;

  const title = doc === "terms" ? "Terms of Service" : "Privacy Policy";

  return createPortal(
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-[rgba(40,10,35,0.5)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(88dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border-4 border-white bg-[#fff8fc] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-pink-100 px-5 py-4">
          <h2
            id={titleId}
            className="m-0 font-toy text-xl font-black text-[#5b2a4a]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-lg font-black text-[#5b2a4a] shadow-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {doc === "terms" ? <TermsBody /> : <PrivacyBody />}
        </div>
        <div className="border-t border-pink-100 px-5 py-3 text-center text-xs font-semibold text-[#8a5f7c]">
          Need help? <SupportLink />
        </div>
      </div>
    </div>,
    document.body,
  );
}

type SiteFooterProps = {
  className?: string;
  /** Compact stack for menus / settings panels */
  variant?: "footer" | "inline";
};

/**
 * Shared Terms / Privacy / Support links — landing footer + vault settings.
 */
export function SiteLegalLinks({
  className = "",
  variant = "footer",
}: SiteFooterProps) {
  const [doc, setDoc] = useState<LegalDoc | null>(null);

  const linkClass =
    variant === "footer"
      ? "text-xs font-bold text-[#8a5f7c] underline-offset-2 hover:underline"
      : "w-full rounded-xl px-3 py-2.5 text-left text-xs font-bold text-[#5b2a4a] hover:bg-pink-50";

  return (
    <>
      <nav
        aria-label="Legal and support"
        className={
          variant === "footer"
            ? `flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${className}`
            : `flex flex-col gap-0.5 ${className}`
        }
      >
        <button
          type="button"
          className={linkClass}
          onClick={() => setDoc("terms")}
        >
          Terms of Service
        </button>
        {variant === "footer" ? (
          <span aria-hidden className="text-[0.65rem] text-pink-300">
            ·
          </span>
        ) : null}
        <button
          type="button"
          className={linkClass}
          onClick={() => setDoc("privacy")}
        >
          Privacy Policy
        </button>
        {variant === "footer" ? (
          <span aria-hidden className="text-[0.65rem] text-pink-300">
            ·
          </span>
        ) : null}
        <a href={SUPPORT_MAILTO} className={linkClass}>
          {variant === "footer" ? "Support" : `Support · ${SUPPORT_EMAIL}`}
        </a>
      </nav>
      <LegalModal doc={doc} onClose={() => setDoc(null)} />
    </>
  );
}
