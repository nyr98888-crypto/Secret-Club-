"use client";

import { useState } from "react";
import { VipUpgradeModal } from "./VipUpgradeModal";

/**
 * Entry trigger for the price-agnostic Magic Chest modal.
 * Never surfaces a dollar amount in the UI.
 */
export function VipUpsell({
  reason = "✨ Unlock the Magic Chest",
  className,
}: {
  reason?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className ?? "btn-vip"}
        onClick={() => setOpen(true)}
      >
        {reason}
      </button>
      <VipUpgradeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
