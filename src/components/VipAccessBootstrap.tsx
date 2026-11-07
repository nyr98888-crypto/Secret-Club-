"use client";

import { Suspense, useEffect, useState } from "react";
import {
  subscribeVipPassToast,
  useVipKeyFromUrl,
} from "@/hooks/useVipAccess";

/** Mounts promo `?vip=` VIP unlock (needs Suspense for useSearchParams). */
function VipAccessInner() {
  useVipKeyFromUrl();
  return null;
}

function VipPassToastHost() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    return subscribeVipPassToast((msg) => {
      setMessage(msg);
      window.setTimeout(() => setMessage(""), 3800);
    });
  }, []);

  if (!message) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <p
        className="max-w-md animate-[secret-sparkle_1.2s_ease-in-out_infinite] rounded-full border-2 border-white px-5 py-3 text-center text-sm font-black text-[#5b2a4a] shadow-[0_10px_0_rgba(244,114,182,0.35)]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #fff7fb 0%, #ffe4f3 50%, #fce7f3 100%)",
        }}
      >
        {message}
      </p>
    </div>
  );
}

export function VipAccessBootstrap() {
  return (
    <>
      <Suspense fallback={null}>
        <VipAccessInner />
      </Suspense>
      <VipPassToastHost />
    </>
  );
}

export default VipAccessBootstrap;
