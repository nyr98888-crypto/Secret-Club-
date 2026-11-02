"use client";

import { useState } from "react";
import { UnlockVaultModal } from "@/components/vault/UnlockVaultModal";

const VIP_PRICE =
  process.env.NEXT_PUBLIC_VIP_PRICE_LABEL?.trim() || "$4.99";

/**
 * Entry trigger for the $4.99 Parent Guarantee Bestie Vault modal.
 */
export function VipUpsell({
  reason = `💖 Unlock Bestie Vault · ${VIP_PRICE}`,
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
      <UnlockVaultModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
