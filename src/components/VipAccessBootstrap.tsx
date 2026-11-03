"use client";

import { Suspense } from "react";
import { useVipKeyFromUrl } from "@/hooks/useVipAccess";

/** Mounts promo `?key=` VIP unlock (needs Suspense for useSearchParams). */
function VipAccessInner() {
  useVipKeyFromUrl();
  return null;
}

export function VipAccessBootstrap() {
  return (
    <Suspense fallback={null}>
      <VipAccessInner />
    </Suspense>
  );
}

export default VipAccessBootstrap;
