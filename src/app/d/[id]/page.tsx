"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { UnlockGate } from "@/components/UnlockGate";
import type { PublicClub } from "@/lib/types";
import Link from "next/link";

export default function DropPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<PublicClub | null>(null);
  const [locked, setLocked] = useState(true);
  const [bodyText, setBodyText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState("");

  const vaultUrl = useMemo(() => {
    if (!club) return "";
    if (typeof window === "undefined") return `/join/${club.slug}`;
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      (!/localhost|127\.0\.0\.1|vercel\.app/i.test(window.location.origin)
        ? window.location.origin
        : "https://www.secretclubscrapbook.com");
    return `${origin}/join/${club.slug}`;
  }, [club]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/drops/${id}`);
      const data = await res.json();
      if (!res.ok) {
        if (!cancelled) setError("Drop not found");
        return;
      }
      if (cancelled) return;
      setClub(data.club);
      if (!data.locked && data.drop) {
        setLocked(false);
        setBodyText(data.drop.bodyText);
        setImage(data.drop.imageBlobUrl);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="shell">
        <p>Checking the seal…</p>
      </main>
    );
  }

  if (error || !club) {
    return (
      <main className="shell">
        <p className="error">{error}</p>
      </main>
    );
  }

  if (locked) {
    return (
      <main
        className="shell theme-shell"
        data-aesthetic={club.aesthetic}
        data-circle={club.circleMode}
      >
        <UnlockGate
          club={club}
          dropId={id}
          vaultUrl={vaultUrl}
          onUnlocked={(payload) => {
            const focus = payload.focusDrop as
              | { bodyText: string; imageBlobUrl: string | null }
              | null
              | undefined;
            if (focus) {
              setBodyText(focus.bodyText);
              setImage(focus.imageBlobUrl);
            }
            setLocked(false);
          }}
        />
      </main>
    );
  }

  return (
    <main
      className="shell theme-shell"
      data-aesthetic={club.aesthetic}
      data-circle={club.circleMode}
    >
      <article className="locked-capsule open">
        <div className="capsule-face" style={{ cursor: "default" }}>
          <span className="capsule-lock" aria-hidden>
            🔓
          </span>
          <span className="capsule-copy">
            <strong className="capsule-title">UNLOCKED CAPSULE</strong>
            <span className="meta">{club.name}</span>
          </span>
        </div>
        <div className="capsule-body">
          <p>{bodyText}</p>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="drop-image" />
          ) : null}
          <Link
            className="btn-primary"
            href={`/join/${club.slug}`}
            style={{ display: "inline-block", marginTop: "1rem" }}
          >
            Open full vault
          </Link>
        </div>
      </article>
    </main>
  );
}
