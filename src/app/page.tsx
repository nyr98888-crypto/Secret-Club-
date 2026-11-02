"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FoundClubWizard } from "@/components/FoundClubWizard";
import { HeroSection } from "@/components/HeroSection";
import { readLocalClub } from "@/lib/localClub";

export default function HomePage() {
  const router = useRouter();
  const [founding, setFounding] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Returning members enter via /vault → SecretRoomOpening (floating locked diary)
    if (readLocalClub()) {
      router.replace("/vault");
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <main className="toy-shell flex items-center justify-center font-toy">
        <p className="text-lg font-semibold text-pink-500">Warming up stickers…</p>
      </main>
    );
  }

  return (
    <main className="toy-shell" data-circle="bestie">
      {!founding ? (
        <HeroSection onStartClub={() => setFounding(true)} />
      ) : (
        <FoundClubWizard
          onDone={() => {
            router.push("/vault");
          }}
        />
      )}
    </main>
  );
}
