"use client";

import { useState } from "react";
import { dropMessage } from "@/lib/share";
import { DROP_STICKERS } from "@/lib/stickers";
import { ensureAudio, playPop } from "@/lib/audio";
import { ShareButton } from "./ShareButton";

export function LockedNoteComposer({
  slug,
  onCreated,
}: {
  slug: string;
  onCreated?: () => void;
}) {
  const [bodyText, setBodyText] = useState("");
  const [stickers, setStickers] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [error, setError] = useState("");

  function stamp(sticker: string) {
    void ensureAudio();
    playPop();
    setStickers((s) => [...s, sticker].slice(0, 24));
    setBodyText((t) => (t ? `${t} ${sticker}` : sticker));
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          bodyText,
          imageBlobUrl: image,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not lock drop");
        return;
      }
      const url = `${window.location.origin}${data.path}`;
      setShareUrl(url);
      setBodyText("");
      setStickers([]);
      setImage(null);
      onCreated?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="composer">
      <h3>New Locked Drop</h3>
      <textarea
        className="text-area"
        rows={4}
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
        placeholder="A note only your circle can open…"
      />
      {stickers.length > 0 ? (
        <div className="sticker-preview" aria-label="Stamped stickers">
          {stickers.map((s, i) => (
            <span key={`${s}-${i}`} className="sticker-chip">
              {s}
            </span>
          ))}
        </div>
      ) : null}
      <div className="sticker-tray">
        <p className="sticker-tray-label">Sticker Tray — tap to stamp</p>
        <div className="sticker-grid">
          {DROP_STICKERS.map((s) => (
            <button
              key={s}
              type="button"
              className="sticker-btn"
              onClick={() => stamp(s)}
              aria-label={`Stamp ${s}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <label className="photo-upload">
        Optional photo capsule
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setImage(String(reader.result));
            reader.readAsDataURL(file);
          }}
        />
      </label>
      {error ? <p className="error">{error}</p> : null}
      {!shareUrl ? (
        <button
          type="button"
          className="btn-primary"
          disabled={!bodyText.trim() || busy}
          onClick={save}
        >
          {busy ? "Locking…" : "Lock in the vault"}
        </button>
      ) : (
        <div className="share-success">
          <p>New drop locked in the vault.</p>
          <ShareButton
            label="Share drop link"
            payload={{
              title: "Vault drop",
              text: dropMessage(shareUrl),
              url: shareUrl,
            }}
          />
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShareUrl("")}
          >
            Write another
          </button>
        </div>
      )}
    </div>
  );
}
