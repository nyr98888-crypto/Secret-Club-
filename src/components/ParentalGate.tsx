"use client";

import { useEffect, useState } from "react";

const PARENT_QUESTION = "Parent Verification: What is 7 × 9?";
const PARENT_ANSWER = 63;

export function ParentalGate({
  open,
  onClose,
  onUnlocked,
}: {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue("");
    setError("");
    setWrong(false);
  }, [open]);

  function submit() {
    if (Number(value.trim()) === PARENT_ANSWER) {
      setError("");
      setValue("");
      setWrong(false);
      onUnlocked();
      return;
    }
    setError("Hmm, that isn’t right. Ask a grown-up!");
    setWrong(false);
    // Retrigger CSS animation
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
        <p className="font-semibold">{PARENT_QUESTION}</p>
        <p className="fine-print">
          Grown-ups unlock the Magic Chest. Checkout opens next — no prices shown
          here.
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
          <button type="button" className="btn-primary" onClick={submit}>
            Continue to checkout
          </button>
        </div>
      </div>
    </div>
  );
}
