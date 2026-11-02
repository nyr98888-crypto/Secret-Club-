"use client";

export function IntruderAlert({ secondsLeft }: { secondsLeft: number }) {
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");
  return (
    <div className="intruder-alert" role="alert">
      <div className="intruder-stamp">INTRUDER ALERT</div>
      <p>System Locked</p>
      <p className="intruder-timer">Vault sealed — try again in {mm}:{ss}</p>
    </div>
  );
}
