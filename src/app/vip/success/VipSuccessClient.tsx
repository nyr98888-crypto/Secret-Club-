"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function VipSuccessClient() {
  const params = useSearchParams();
  const [status, setStatus] = useState("Activating VIP Club Key…");

  useEffect(() => {
    const sessionId = params.get("session_id");
    const dev = params.get("dev");
    (async () => {
      if (dev) {
        setStatus("VIP Club Key unlocked (dev mode).");
        return;
      }
      if (sessionId) {
        for (let i = 0; i < 6; i++) {
          const res = await fetch("/api/entitlements");
          const data = await res.json();
          if (data.vip) {
            setStatus(
              "VIP Club Key unlocked. Lifetime access is live on this browser.",
            );
            return;
          }
          await new Promise((r) => setTimeout(r, 800));
        }
        setStatus(
          "Payment received. If VIP isn’t active yet, refresh in a few seconds while the webhook lands.",
        );
        return;
      }
      setStatus("Welcome back.");
    })();
  }, [params]);

  return (
    <section className="wizard">
      <h1>VIP Club Key</h1>
      <p>{status}</p>
      <ul>
        <li>Unlimited watermark-free PDF card exports</li>
        <li>All premium sticker & glyph packs</li>
        <li>Up to 5 vaults on this browser</li>
      </ul>
      <Link className="btn-primary" href="/">
        Back to Secret Club
      </Link>
    </section>
  );
}
