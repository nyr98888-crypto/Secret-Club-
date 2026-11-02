"use client";

import { useEffect, useMemo, useState } from "react";
import { PREMIUM_GLYPHS, STARTER_GLYPHS } from "@/lib/passcode";
import { vibrateTap } from "@/lib/haptics";
import { ensureAudio, playChime } from "@/lib/audio";
import {
  clearFailures,
  getLockout,
  registerFailure,
  remainingLockMs,
} from "@/lib/lockout";
import { AskFounderButton } from "./AskFounderButton";
import { IntruderAlert } from "./IntruderAlert";

export function EmojiPad({
  lockKey,
  clubName,
  vaultUrl,
  vip = false,
  mode = "unlock",
  targetLength = 4,
  onComplete,
  onPartialWrong,
}: {
  lockKey: string;
  clubName: string;
  vaultUrl: string;
  vip?: boolean;
  mode?: "unlock" | "create";
  targetLength?: number;
  onComplete: (glyphs: string[]) => Promise<"partial" | "complete" | "wrong" | "ok">;
  onPartialWrong?: () => void;
}) {
  const glyphs = useMemo(
    () => (vip ? [...STARTER_GLYPHS, ...PREMIUM_GLYPHS] : STARTER_GLYPHS),
    [vip],
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [fails, setFails] = useState(0);
  const [lockMs, setLockMs] = useState(0);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const state = getLockout(lockKey);
    setFails(state.failedAttempts);
    setLockMs(remainingLockMs(lockKey));
  }, [lockKey]);

  useEffect(() => {
    if (lockMs <= 0) return;
    const id = window.setInterval(() => {
      const left = remainingLockMs(lockKey);
      setLockMs(left);
      if (left <= 0) {
        const state = getLockout(lockKey);
        setFails(state.failedAttempts);
      }
    }, 250);
    return () => clearInterval(id);
  }, [lockKey, lockMs]);

  const locked = lockMs > 0;

  async function pushGlyph(g: string) {
    if (locked || busy) return;
    void ensureAudio();
    vibrateTap();
    playChime();
    const next = [...selected, g].slice(0, targetLength);
    setSelected(next);

    if (mode === "create") {
      if (next.length === targetLength) {
        await onComplete(next);
      }
      return;
    }

    if (next.length === 0) return;
    setBusy(true);
    try {
      const result = await onComplete(next);
      if (result === "wrong") {
        setShake(true);
        setTimeout(() => setShake(false), 400);
        const state = registerFailure(lockKey);
        setFails(state.failedAttempts);
        setLockMs(remainingLockMs(lockKey));
        setSelected([]);
        onPartialWrong?.();
      } else if (result === "complete") {
        clearFailures(lockKey);
        setFails(0);
      } else if (result === "partial") {
        // keep building
      }
    } finally {
      setBusy(false);
    }
  }

  function backspace() {
    if (locked || busy) return;
    setSelected((s) => s.slice(0, -1));
  }

  return (
    <div className={`emoji-pad ${shake ? "shake" : ""}`}>
      {locked ? (
        <IntruderAlert secondsLeft={Math.ceil(lockMs / 1000)} />
      ) : (
        <>
          <div className="glyph-slots" aria-label="Passcode slots">
            {Array.from({ length: targetLength }).map((_, i) => (
              <span key={i} className="glyph-slot">
                {selected[i] || "·"}
              </span>
            ))}
          </div>
          <div className="glyph-grid">
            {glyphs.map((g) => (
              <button
                key={g}
                type="button"
                className="glyph-btn"
                onClick={() => pushGlyph(g)}
                disabled={busy}
              >
                {g}
              </button>
            ))}
          </div>
          <button type="button" className="btn-ghost" onClick={backspace}>
            Clear last
          </button>
          {mode === "unlock" && fails >= 2 ? (
            <AskFounderButton clubName={clubName} vaultUrl={vaultUrl} />
          ) : null}
        </>
      )}
    </div>
  );
}
