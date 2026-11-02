"use client";

export function VaultDoor({ open }: { open: boolean }) {
  return (
    <div className={`vault-door ${open ? "open" : ""}`} aria-hidden>
      <div className="door-left" />
      <div className="door-right" />
      <div className="wax-seal">{open ? "broken" : ""}</div>
    </div>
  );
}
