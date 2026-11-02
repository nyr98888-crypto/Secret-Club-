"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PASSCODE_LENGTH,
  clearLocalClub,
  passcodesMatch,
  setVaultUnlocked,
  type LocalClub,
} from "@/lib/localClub";
import { EmojiPad } from "./EmojiPad";
import { VaultDoor } from "./VaultDoor";
import { UnlockPayoff } from "./UnlockPayoff";
import { vibrateUnlock } from "@/lib/haptics";
import { ensureAudio, playUnlockSound } from "@/lib/audio";

export function LocalVaultLock({
  club,
  onUnlocked,
}: {
  club: LocalClub;
  onUnlocked: () => void;
}) {
  const router = useRouter();
  const [payoff, setPayoff] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [error, setError] = useState("");

  function resetAll() {
    clearLocalClub();
    router.replace("/");
  }

  return (
    <div
      className="unlock-gate theme-shell"
      data-circle={club.vaultType}
      data-aesthetic={club.aesthetic}
    >
      <UnlockPayoff mode={club.vaultType} active={payoff} />
      <VaultDoor open={doorOpen} />
      <p className="eyebrow">
        {club.vaultType === "squad" ? "SquadVault" : "BestieVault"}
      </p>
      <h2>Enter the 3-key passcode</h2>
      <p className="lede">Classified access for {club.clubName}</p>

      <EmojiPad
        lockKey={`local-unlock:${club.createdAt}`}
        clubName={club.clubName}
        vaultUrl="/vault"
        mode="unlock"
        targetLength={PASSCODE_LENGTH}
        onComplete={async (glyphs) => {
          if (glyphs.length < PASSCODE_LENGTH) return "partial";
          if (!passcodesMatch(glyphs, club.passcode)) {
            setError("Wrong key — try again");
            return "wrong";
          }
          setError("");
          setPayoff(true);
          vibrateUnlock();
          void ensureAudio().then(() => playUnlockSound());
          setVaultUnlocked(true);
          setTimeout(() => {
            setDoorOpen(true);
            onUnlocked();
          }, 900);
          return "complete";
        }}
      />

      {error ? <p className="error">{error}</p> : null}

      <button
        type="button"
        className="btn-link"
        style={{ marginTop: "1.25rem", opacity: 0.75, fontSize: "0.85rem" }}
        onClick={resetAll}
      >
        Reset / Start Over
      </button>
      <p className="fine-print" style={{ marginTop: "0.35rem" }}>
        Clears this device’s vault from local storage.
      </p>
    </div>
  );
}
