"use client";

import { useState } from "react";
import { exportScrapbookPage, printCanvas } from "@/lib/exportPage";

type PrintExportActionsProps = {
  /** Optional override; defaults to the live `[data-print-root]` surface */
  getPrintRoot?: () => HTMLElement | null;
  iconOnly?: boolean;
  className?: string;
};

function defaultPrintRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return (
    document.querySelector<HTMLElement>("[data-print-root]:not([hidden])") ??
    document.querySelector<HTMLElement>(".scrapbook-canvas-surface")
  );
}

/**
 * Kid-friendly Print Page + Save to Photos actions for the vault header.
 */
export function PrintExportActions({
  getPrintRoot = defaultPrintRoot,
  iconOnly = false,
  className = "",
}: PrintExportActionsProps) {
  const [busy, setBusy] = useState<"print" | "save" | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  function flashHint(msg: string) {
    setHint(msg);
    window.setTimeout(() => setHint(null), 2200);
  }

  async function onPrint() {
    const root = getPrintRoot();
    if (!root || busy) return;
    setBusy("print");
    try {
      await printCanvas(root);
    } finally {
      setBusy(null);
    }
  }

  async function onSave() {
    const root = getPrintRoot();
    if (!root || busy) return;
    setBusy("save");
    try {
      const ok = await exportScrapbookPage(root, "secret-club-page.png");
      flashHint(ok ? "Saved! ✨" : "Try Print Page 🖨️");
      if (!ok) {
        try {
          await printCanvas(root);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      console.error("Save page failed", err);
      flashHint("Try Print Page 🖨️");
    } finally {
      setBusy(null);
    }
  }

  const hintEl = hint ? (
    <span className="pointer-events-none absolute -bottom-7 right-0 whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[0.6rem] font-extrabold text-pink-600 shadow">
      {hint}
    </span>
  ) : null;

  if (iconOnly) {
    return (
      <div className={`relative flex items-center gap-1 ${className}`}>
        <button
          type="button"
          onClick={() => void onPrint()}
          disabled={Boolean(busy)}
          className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full border border-emerald-200
            bg-emerald-50 text-base shadow-sm transition hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
          aria-label="Print page for your wall or binder"
          title="Print for your real wall or binder!"
        >
          <span className={busy === "print" ? "animate-pulse" : "animate-bounce"}>
            🖨️
          </span>
        </button>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={Boolean(busy)}
          className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full border border-sky-200
            bg-sky-50 text-base shadow-sm transition hover:bg-sky-100 active:scale-95 disabled:opacity-50"
          aria-label="Save page to photos"
          title="Save a picture to your photos"
        >
          <span className={busy === "save" ? "animate-pulse" : ""}>📸</span>
        </button>
        {hintEl}
      </div>
    );
  }

  return (
    <div className={`relative flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => void onPrint()}
        disabled={Boolean(busy)}
        className="group inline-flex min-h-[44px] flex-col items-center justify-center rounded-2xl border-2 border-emerald-200
          bg-gradient-to-b from-emerald-50 to-teal-50 px-2.5 py-1 shadow-sm transition
          hover:-translate-y-0.5 hover:border-emerald-300 active:scale-95 disabled:opacity-50"
        aria-label="Print page"
        title="Print for your real wall or binder!"
      >
        <span className="flex items-center gap-1 text-xs font-black text-emerald-700">
          <span className="inline-block animate-bounce" aria-hidden>
            🖨️
          </span>
          Print Page
        </span>
        <span className="text-[0.55rem] font-bold text-emerald-600/80">
          for your wall!
        </span>
      </button>
      <button
        type="button"
        onClick={() => void onSave()}
        disabled={Boolean(busy)}
        className="inline-flex min-h-[44px] items-center gap-1 rounded-2xl border-2 border-sky-200
          bg-gradient-to-b from-sky-50 to-indigo-50 px-2.5 py-1 text-xs font-black text-sky-700
          shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 active:scale-95 disabled:opacity-50"
        aria-label="Save to photos"
        title="Save a clean PNG"
      >
        <span aria-hidden>📸</span>
        Save
      </button>
      {hintEl}
    </div>
  );
}

export default PrintExportActions;
