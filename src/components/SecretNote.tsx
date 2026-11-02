"use client";

import { useEffect, useId, useState } from "react";

export type SealKind = "wax" | "heart" | "washi";

export type SecretNoteAuthor = {
  codeName: string;
  avatarUrl?: string;
  initial?: string;
};

export type SecretNoteData = {
  id: string;
  message: string;
  createdAt: string;
  author: SecretNoteAuthor;
  seal: SealKind;
  /** Optional override; defaults to SEAL_OPTIONS path */
  sealSrc?: string;
  /** Position on page as percentages (0–100) */
  x?: number;
  y?: number;
};

export const SEAL_OPTIONS: {
  id: SealKind;
  label: string;
  src: string;
  emoji: string;
}[] = [
  {
    id: "wax",
    label: "Wax seal",
    src: "/stickers/tactile_stationery/wax_seal.svg",
    emoji: "🕯️",
  },
  {
    id: "heart",
    label: "Heart sticker",
    src: "/stickers/secret_notes/heart_seal.svg",
    emoji: "💖",
  },
  {
    id: "washi",
    label: "Washi tape",
    src: "/stickers/secret_notes/washi_strip.svg",
    emoji: "🎀",
  },
];

export function sealSrcFor(seal: SealKind, override?: string) {
  if (override) return override;
  return SEAL_OPTIONS.find((s) => s.id === seal)?.src ?? SEAL_OPTIONS[0].src;
}

function formatNoteDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function AuthorAvatar({
  author,
  size = "md",
}: {
  author: SecretNoteAuthor;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7 text-[0.65rem]" : "h-9 w-9 text-xs";
  const letter =
    author.initial?.slice(0, 1) ||
    author.codeName.trim().slice(0, 1).toUpperCase() ||
    "?";

  if (author.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={author.avatarUrl}
        alt=""
        className={`${dim} rounded-full object-cover ring-2 ring-white shadow-sm`}
      />
    );
  }

  return (
    <span
      className={`${dim} inline-grid place-items-center rounded-full bg-gradient-to-br from-pink-400 to-violet-400 font-bold text-white ring-2 ring-white shadow-sm`}
      aria-hidden
    >
      {letter}
    </span>
  );
}

function SealMark({
  seal,
  sealSrc,
  className = "",
}: {
  seal: SealKind;
  sealSrc?: string;
  className?: string;
}) {
  const opt = SEAL_OPTIONS.find((s) => s.id === seal) ?? SEAL_OPTIONS[0];
  const src = sealSrcFor(seal, sealSrc);
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span className={`inline-grid place-items-center text-2xl ${className}`} aria-hidden>
        {opt.emoji}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={opt.label}
      className={`object-contain drop-shadow-md ${className}`}
      draggable={false}
      onError={() => setBroken(true)}
    />
  );
}

/** Compact folded paper token sealed on the scrapbook page */
export function SecretNote({
  note,
  className = "",
}: {
  note: SecretNoteData;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sealSrc = sealSrcFor(note.seal, note.sealSrc);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative w-[7.25rem] cursor-pointer border-0 bg-transparent p-0 text-left ${className}`}
        aria-label={`Secret note from ${note.author.codeName}. Tap to unfold.`}
      >
        {/* Folded paper token */}
        <span
          className="relative block aspect-[5/4] w-full overflow-hidden rounded-md
            bg-gradient-to-br from-[#fff9f1] via-[#ffe9d6] to-[#f5d7b8]
            shadow-[0_8px_16px_rgba(74,43,69,0.18),0_1px_0_rgba(255,255,255,0.8)_inset]
            transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_22px_rgba(74,43,69,0.22)]
            group-active:translate-y-0"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #fffaf3 0%, #ffe8d2 48%, #f0d2b4 100%), repeating-linear-gradient(0deg, transparent 0 11px, rgba(180,120,90,0.07) 11px 12px)",
          }}
        >
          {/* Fold crease */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-[#c9a28a]/70 to-transparent"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-0 w-0
              border-l-[1.35rem] border-t-[1.35rem] border-l-transparent border-t-[#e8c9a8]
              shadow-[-2px_2px_4px_rgba(0,0,0,0.08)]"
          />

          {/* Seal sticker */}
          <span className="absolute left-1/2 top-[42%] z-[1] -translate-x-1/2 -translate-y-1/2">
            <SealMark
              seal={note.seal}
              sealSrc={note.sealSrc}
              className={
                note.seal === "washi"
                  ? "h-7 w-[4.5rem] rotate-[-8deg]"
                  : "h-11 w-11"
              }
            />
          </span>
        </span>

        {/* Pulsing "Tap to Unfold" + author avatar */}
        <span className="absolute -bottom-2 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-pink-200/80 bg-white/95 px-2 py-1 shadow-md">
          <AuthorAvatar author={note.author} size="sm" />
          <span className="relative text-[0.62rem] font-extrabold tracking-wide text-pink-600">
            Tap to Unfold
            <span
              aria-hidden
              className="absolute inset-0 animate-ping rounded-full bg-pink-400/25"
            />
          </span>
        </span>
      </button>

      {/* Unfold modal */}
      {open ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-[rgba(40,20,40,0.48)] p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(false)}
        >
          <div
            className={`relative w-full max-w-md origin-center transition-all duration-300 ease-out
              ${
                entered
                  ? "scale-100 rotate-0 opacity-100"
                  : "scale-95 rotate-[-2deg] opacity-0"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <article
              className="relative overflow-hidden rounded-sm bg-[#fffaf2] px-5 pb-6 pt-4
                shadow-[0_24px_50px_rgba(74,43,69,0.28),0_2px_0_rgba(255,255,255,0.9)_inset]
                sm:px-7 sm:pb-8 sm:pt-5"
              style={{
                backgroundImage:
                  "linear-gradient(#fffaf2, #fff4e8), repeating-linear-gradient(transparent 0 27px, rgba(255,182,210,0.28) 27px 28px)",
                backgroundBlendMode: "multiply",
              }}
            >
              {/* Top seal */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AuthorAvatar author={note.author} />
                  <div>
                    <p
                      id={titleId}
                      className="m-0 text-sm font-extrabold text-[var(--ink)]"
                    >
                      {note.author.codeName}
                    </p>
                    <p className="m-0 text-xs text-[var(--muted)]">
                      {formatNoteDate(note.createdAt)}
                    </p>
                  </div>
                </div>
                <SealMark
                  seal={note.seal}
                  sealSrc={sealSrc}
                  className={
                    note.seal === "washi"
                      ? "h-8 w-24 rotate-[-6deg]"
                      : "h-14 w-14 -rotate-6"
                  }
                />
              </div>

              <p
                className="m-0 min-h-[7rem] whitespace-pre-wrap text-[1.2rem] leading-relaxed text-[#4a2b45]"
                style={{
                  fontFamily:
                    '"Segoe Print", "Bradley Hand", "Apple Chancery", "Comic Sans MS", cursive',
                }}
              >
                {note.message}
              </p>

              <button
                type="button"
                className="mt-5 rounded-full border border-[var(--stroke)] bg-white/80 px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-0.5"
                onClick={() => setOpen(false)}
              >
                Fold it back
              </button>
            </article>
          </div>
        </div>
      ) : null}
    </>
  );
}

export type CreateSecretNotePayload = {
  message: string;
  seal: SealKind;
};

/** Modal to compose a sealed note and stick it to the current page */
export function CreateSecretNoteModal({
  open,
  onClose,
  onStick,
  author,
}: {
  open: boolean;
  onClose: () => void;
  onStick: (payload: CreateSecretNotePayload) => void;
  author: SecretNoteAuthor;
}) {
  const [message, setMessage] = useState("");
  const [seal, setSeal] = useState<SealKind>("wax");
  const [entered, setEntered] = useState(false);
  const titleId = useId();
  const max = 200;

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function stick() {
    const trimmed = message.trim();
    if (!trimmed) return;
    onStick({ message: trimmed.slice(0, max), seal });
    setMessage("");
    setSeal("wax");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[85] grid place-items-end bg-[rgba(40,20,40,0.45)] p-3 backdrop-blur-[2px] sm:place-items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md origin-bottom transition-all duration-300 ease-out sm:origin-center
          ${
            entered
              ? "scale-100 rotate-0 opacity-100"
              : "scale-95 rotate-[-2deg] opacity-0"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-2xl border-2 border-[var(--stroke)] bg-[var(--panel)] p-4 shadow-[var(--shadow)] backdrop-blur-md sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="eyebrow m-0">Secret note</p>
              <h3 id={titleId} className="m-0 text-lg">
                Seal a message
              </h3>
            </div>
            <AuthorAvatar author={author} />
          </div>

          <label className="helper m-0 block" htmlFor="secret-note-body">
            Your secret (max {max})
          </label>
          <textarea
            id="secret-note-body"
            className="text-area mt-1"
            rows={4}
            maxLength={max}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, max))}
            placeholder="Write something only your circle should see…"
          />
          <p className="fine-print m-0 text-right">
            {message.length}/{max}
          </p>

          <p className="sticker-tray-label mt-2">Seal picker</p>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {SEAL_OPTIONS.map((opt) => {
              const active = seal === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSeal(opt.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-2.5 transition
                    ${
                      active
                        ? "border-[var(--accent)] bg-pink-50/80 shadow-sm"
                        : "border-[var(--stroke)] bg-white/70 hover:border-pink-300"
                    }`}
                  aria-pressed={active}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={opt.src}
                    alt=""
                    className={
                      opt.id === "washi" ? "h-7 w-16 object-contain" : "h-10 w-10 object-contain"
                    }
                  />
                  <span className="text-[0.68rem] font-bold text-[var(--ink)]">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!message.trim()}
              onClick={stick}
            >
              Stick to Page
            </button>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function createSecretNote(
  payload: CreateSecretNotePayload,
  author: SecretNoteAuthor,
): SecretNoteData {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `note-${Date.now()}`,
    message: payload.message,
    seal: payload.seal,
    sealSrc: sealSrcFor(payload.seal),
    createdAt: new Date().toISOString(),
    author,
    x: 12 + Math.random() * 55,
    y: 55 + Math.random() * 25,
  };
}
