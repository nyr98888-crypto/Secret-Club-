"use client";

import { useEffect, useState } from "react";

type DeviceType = "ios" | "android" | "desktop";

type InstallGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function detectDevice(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const ua =
    navigator.userAgent ||
    navigator.vendor ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((window as any).opera as string) ||
    "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

export function InstallGuideModal({ isOpen, onClose }: InstallGuideModalProps) {
  const [device, setDevice] = useState<DeviceType>("ios");

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-guide-title"
      onClick={onClose}
    >
      <div
        className="my-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden overflow-y-auto rounded-3xl border-4 border-pink-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-pink-400 to-rose-400 p-5 text-white">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              📲
            </span>
            <div>
              <h3
                id="install-guide-title"
                className="text-base font-black tracking-wide"
              >
                Install My Secret Club
              </h3>
              <p className="text-xs font-medium text-pink-100">
                Add to your screen like a real app!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 font-bold text-white transition-colors hover:bg-white/30"
            aria-label="Close install guide"
          >
            ✕
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-1 border-b border-pink-100 bg-pink-50 p-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setDevice("ios")}
            className={`rounded-xl py-2 transition-all ${
              device === "ios"
                ? "bg-white text-pink-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            🍎 iPhone / iPad
          </button>
          <button
            type="button"
            onClick={() => setDevice("android")}
            className={`rounded-xl py-2 transition-all ${
              device === "android"
                ? "bg-white text-pink-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            🤖 Android
          </button>
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={`rounded-xl py-2 transition-all ${
              device === "desktop"
                ? "bg-white text-pink-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            💻 PC / Mac
          </button>
        </div>

        <div className="space-y-4 p-6 text-gray-700">
          {device === "ios" ? (
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-pink-600">
                  1
                </span>
                <span>
                  Open this link in <strong>Safari</strong> (does not work in
                  Chrome on iPhone).
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-pink-600">
                  2
                </span>
                <span>
                  Tap the <strong>Share button</strong> at the bottom (the square
                  with an arrow pointing up{" "}
                  <span className="inline-block rounded border border-gray-300 px-1 text-xs">
                    ⎋
                  </span>
                  ).
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-pink-600">
                  3
                </span>
                <span>
                  Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>{" "}
                  (➕).
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-pink-600">
                  4
                </span>
                <span>
                  Tap <strong>Add</strong> top right. The app will appear on your
                  home screen full-screen!
                </span>
              </li>
            </ol>
          ) : null}

          {device === "android" ? (
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-pink-600">
                  1
                </span>
                <span>
                  Open this link in <strong>Google Chrome</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-pink-600">
                  2
                </span>
                <span>
                  Tap the <strong>three vertical dots (⋮)</strong> in the
                  top-right corner.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-pink-600">
                  3
                </span>
                <span>
                  Tap <strong>&quot;Install App&quot;</strong> or{" "}
                  <strong>&quot;Add to Home screen&quot;</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-pink-600">
                  4
                </span>
                <span>
                  Confirm by clicking <strong>Install</strong>. Done!
                </span>
              </li>
            </ol>
          ) : null}

          {device === "desktop" ? (
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-pink-600">
                  1
                </span>
                <span>
                  Open in <strong>Chrome</strong> or <strong>Edge</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-pink-600">
                  2
                </span>
                <span>
                  Click the <strong>Install icon</strong> in the right side of
                  the address bar (looks like a monitor with a down arrow).
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-pink-600">
                  3
                </span>
                <span>
                  Click <strong>Install</strong> to run it in its own clean
                  window.
                </span>
              </li>
            </ol>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-end border-t border-pink-100 bg-pink-50/60 p-4 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-pink-500 py-2.5 text-xs font-extrabold text-white shadow transition-colors hover:bg-pink-600"
          >
            Got It! 💖
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallGuideModal;
