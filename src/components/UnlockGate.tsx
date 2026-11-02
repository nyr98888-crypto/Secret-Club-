"use client";

import { useState } from "react";
import type { CircleMode, PublicClub } from "@/lib/types";
import { EmojiPad } from "./EmojiPad";
import { UnlockPayoff } from "./UnlockPayoff";
import { VaultDoor } from "./VaultDoor";
import { vibrateUnlock } from "@/lib/haptics";
import { ensureAudio, playUnlockSound } from "@/lib/audio";

type UnlockResult = {
  status: string;
  needsProfile?: boolean;
  club?: PublicClub;
  member?: { id: string; codeName: string; photoBlobUrl: string | null };
  drops?: unknown[];
  members?: unknown[];
  focusDrop?: unknown;
};

export function UnlockGate({
  club,
  dropId,
  vaultUrl,
  onUnlocked,
}: {
  club: PublicClub;
  dropId?: string;
  vaultUrl: string;
  onUnlocked: (payload: UnlockResult) => void;
}) {
  const [payoff, setPayoff] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [pendingGlyphs, setPendingGlyphs] = useState<string[]>([]);
  const [codeName, setCodeName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  async function check(glyphs: string[]) {
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: club.slug,
        dropId,
        glyphs,
      }),
    });
    const data = (await res.json()) as UnlockResult;
    if (data.status === "wrong") return "wrong";
    if (data.status === "partial") return "partial";
    if (data.status === "complete") {
      setPayoff(true);
      vibrateUnlock();
      void ensureAudio().then(() => playUnlockSound());
      setPendingGlyphs(glyphs);
      if (data.needsProfile) {
        setNeedsProfile(true);
        setTimeout(() => setDoorOpen(true), 900);
        return "complete";
      }
      setTimeout(() => {
        setDoorOpen(true);
        onUnlocked(data);
      }, 1100);
      return "complete";
    }
    return "wrong";
  }

  async function finishProfile() {
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: club.slug,
        dropId,
        glyphs: pendingGlyphs,
        codeName,
        photoBlobUrl: photo,
      }),
    });
    const data = (await res.json()) as UnlockResult;
    onUnlocked(data);
  }

  return (
    <div className="unlock-gate" data-circle={club.circleMode}>
      <UnlockPayoff mode={club.circleMode as CircleMode} active={payoff} />
      <VaultDoor open={doorOpen} />
      {!needsProfile ? (
        <>
          <h2>Enter the 3-key passcode</h2>
          <p className="lede">Classified access for {club.name}</p>
          <EmojiPad
            lockKey={`unlock:${club.slug}:${dropId || "club"}`}
            clubName={club.name}
            vaultUrl={vaultUrl}
            targetLength={3}
            onComplete={check}
          />
        </>
      ) : (
        <div className="profile-finish">
          <h2>Pick your code name</h2>
          <input
            className="text-input"
            value={codeName}
            onChange={(e) => setCodeName(e.target.value)}
            maxLength={24}
            placeholder="Code name"
          />
          <label className="photo-upload">
            Optional photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setPhoto(String(reader.result));
                reader.readAsDataURL(file);
              }}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={!codeName.trim()}
            onClick={finishProfile}
          >
            Enter the vault
          </button>
        </div>
      )}
    </div>
  );
}
