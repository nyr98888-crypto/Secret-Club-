import { Suspense } from "react";
import { VipSuccessClient } from "./VipSuccessClient";

export default function VipSuccessPage() {
  return (
    <main className="shell">
      <Suspense fallback={<p>Activating VIP Club Key…</p>}>
        <VipSuccessClient />
      </Suspense>
    </main>
  );
}
