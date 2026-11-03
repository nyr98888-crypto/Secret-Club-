"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const INVITE_HINT_KEY = "sc_invite_hint";

type InviteHint = {
  club: string;
  keys: string;
  savedAt: string;
};

function JoinInviteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const club = (params.get("club") || "").trim();
  const keys = (params.get("keys") || "").trim();
  const [saved, setSaved] = useState(false);

  const hint = useMemo<InviteHint | null>(() => {
    if (!club && !keys) return null;
    return {
      club: club || "Secret Club",
      keys,
      savedAt: new Date().toISOString(),
    };
  }, [club, keys]);

  useEffect(() => {
    if (!hint) return;
    try {
      sessionStorage.setItem(INVITE_HINT_KEY, JSON.stringify(hint));
      setSaved(true);
    } catch {
      /* ignore */
    }
  }, [hint]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-pink-100 via-fuchsia-50 to-violet-100 px-5 py-10 font-toy">
      <div className="w-full max-w-md rounded-[2rem] border-2 border-[#2D0C1E] bg-white p-6 text-center shadow-xl">
        <p className="m-0 text-sm font-bold uppercase tracking-wide text-pink-500">
          Secret invite
        </p>
        <h1 className="club-title mt-2 text-2xl font-bold text-[#2D0C1E]">
          You&apos;re invited to {hint?.club || "a Secret Club"}! 🎀🍓
        </h1>
        <p className="mt-3 text-sm font-semibold text-[#2D0C1E]/80">
          Tap to enter the secret lockbox and decorate our scrapbook together.
        </p>
        {keys ? (
          <p className="mt-4 rounded-2xl border border-[#2D0C1E]/20 bg-pink-50 px-3 py-2 text-sm font-bold text-[#2D0C1E]">
            Passcode keys: <span className="tracking-wide">{keys}</span>
          </p>
        ) : null}
        <button
          type="button"
          className="mt-5 w-full rounded-2xl border-2 border-[#2D0C1E] bg-[#2D0C1E] px-4 py-3 text-sm font-black text-white shadow-md active:scale-[0.99]"
          onClick={() => router.push("/vault")}
        >
          Open the vault ✨
        </button>
        <Link
          href="/"
          className="mt-3 inline-block text-xs font-bold text-pink-600 underline-offset-2 hover:underline"
        >
          Or start your own Secret Club
        </Link>
        {saved ? (
          <p className="mt-3 text-[0.65rem] font-bold text-[#2D0C1E]/55">
            Invite saved on this device
          </p>
        ) : null}
      </div>
    </main>
  );
}

export default function JoinInvitePage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center font-toy text-sm font-bold text-pink-600">
          Opening invite…
        </main>
      }
    >
      <JoinInviteInner />
    </Suspense>
  );
}
