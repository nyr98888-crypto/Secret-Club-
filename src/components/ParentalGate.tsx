"use client";

import { useEffect, useMemo, useState } from "react";

type MathChallenge = { prompt: string; answer: number };

function randomChallenge(): MathChallenge {
  const a = 6 + Math.floor(Math.random() * 4); // 6–9
  const b = 7 + Math.floor(Math.random() * 3); // 7–9
  return {
    prompt: `Parent Verification: What is ${a} × ${b}?`,
    answer: a * b,
  };
}

export function ParentalGate({
  open,
  onClose,
  onUnlocked,
  priceLabel = "$4.99",
}: {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  priceLabel?: string;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [wrong, setWrong] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const challenge = useMemo(
    () => (open ? randomChallenge() : { prompt: "", answer: 0 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reshuffle when opened
    [open],
  );

  useEffect(() => {
    if (!open) return;
    setValue("");
    setError("");
    setWrong(false);
    setAttempts(0);
  }, [open]);

  function submit() {
    if (attempts >= 5) {
      setError("Too many tries — take a breath and ask a grown-up again.");
      return;
    }
    if (Number(value.trim()) === challenge.answer) {
      setError("");
      setValue("");
      setWrong(false);
      onUnlocked();
      return;
    }
    setAttempts((n) => n + 1);
    setError("Hmm, that isn’t right. Ask a grown-up!");
    setWrong(false);
    requestAnimationFrame(() => setWrong(true));
  }

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal
      aria-labelledby="parent-gate-title"
    >
      <div className={`modal parental-gate ${wrong ? "is-wrong" : ""}`}>
        <h2 id="parent-gate-title">Ask a grown-up to unlock</h2>
        <p className="font-semibold">{challenge.prompt}</p>
        <p className="fine-print">
          This opens a secure one-time {priceLabel} Stripe checkout for the
          lifetime Magic Chest unlock. No subscriptions.
        </p>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Answer"
          className="text-input"
          aria-label="Parent verification answer"
          autoFocus
        />
        {error ? <p className="error">{error}</p> : null}
        <div className="row-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={attempts >= 5}
          >
            Continue to {priceLabel} checkout
          </button>
        </div>
      </div>
    </div>
  );
}
