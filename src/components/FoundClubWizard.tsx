"use client";

import { useEffect, useState } from "react";
import {
  createLocalClub,
  saveLocalClub,
  setVaultUnlocked,
  type VaultType,
} from "@/lib/localClub";
import { ensureClubScrapbook } from "@/lib/scrapbookStore";
import { ToyLockbox } from "./ToyLockbox";
import { SlotMachineRoller } from "./SlotMachineRoller";
import { UnlockVaultModal } from "@/components/vault/UnlockVaultModal";
import { SiteLegalLinks } from "@/components/SiteLegal";
import { vibrateTap } from "@/lib/haptics";
import { ensureAudio, playPop } from "@/lib/audio";

type Step = "setup" | "lockbox";

export function FoundClubWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>("setup");
  const [clubName, setClubName] = useState("Strawberry Shortcakes");
  const [clubIcon, setClubIcon] = useState("🍓");
  const [editingName, setEditingName] = useState(false);
  const [vaultType, setVaultType] = useState<VaultType>("bestie");
  const [vipOpen, setVipOpen] = useState(false);
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/entitlements")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.vip) setIsVip(true);
      })
      .catch(() => {
        /* free tier by default */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function goToLock() {
    if (!clubName.trim()) return;
    void ensureAudio();
    vibrateTap();
    playPop();
    setStep("lockbox");
  }

  function seal(passcode: [string, string, string]) {
    const club = createLocalClub({
      clubName: clubName.trim(),
      clubIcon,
      aesthetic: "kawaii_pastel",
      vaultType,
      passcode,
      founder: { codeName: "Me", avatarUrl: null },
    });
    saveLocalClub(club);
    ensureClubScrapbook(club.clubName, club.clubIcon || "📒");
    setVaultUnlocked(true);
    onDone();
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-6 font-toy">
      {step === "setup" ? (
        <div className="flex flex-col gap-8">
          <header className="text-center">
            <p className="text-sm font-semibold text-pink-500">Let’s make your club</p>
            <h1 className="mt-1 text-3xl font-bold text-[#5b2a4a] sm:text-4xl">
              Name & squad size
            </h1>
          </header>

          <section className="rounded-[2rem] border-4 border-white bg-white/70 p-5 shadow-[0_10px_0_rgba(196,181,253,0.45)]">
            <p className="mb-3 text-center text-sm font-semibold text-violet-500">
              Club name
            </p>

            <SlotMachineRoller
              isVip={isVip}
              onOpenVipModal={() => setVipOpen(true)}
              onNameSelected={(name, icon) => {
                setClubName(name);
                setClubIcon(icon);
                setEditingName(false);
              }}
            />

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-2xl" aria-hidden>
                {clubIcon}
              </span>
              {editingName ? (
                <input
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value.slice(0, 32))}
                  maxLength={32}
                  autoFocus
                  className="w-full rounded-2xl border-4 border-pink-200 bg-white px-4 py-2 text-center
                    text-lg font-bold text-[#5b2a4a] outline-none focus:border-pink-400"
                  aria-label="Edit club name"
                />
              ) : (
                <p className="text-center text-lg font-bold text-[#5b2a4a]">
                  {clubName}
                </p>
              )}
              <button
                type="button"
                className="toy-btn shrink-0 bg-[#ffe4f1] px-3 py-2 text-lg"
                aria-label="Edit name"
                onClick={() => setEditingName((v) => !v)}
              >
                ✏️
              </button>
            </div>
          </section>

          <section>
            <p className="mb-3 text-center text-sm font-semibold text-pink-500">
              Who’s invited?
            </p>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  setVaultType("bestie");
                }}
                className={`toy-btn flex items-center justify-center gap-3 px-5 py-5 text-xl text-[#5b2a4a]
                  ${
                    vaultType === "bestie"
                      ? "scale-[1.03] bg-gradient-to-r from-pink-300 to-rose-300"
                      : "bg-white/80"
                  }`}
              >
                <span className="text-3xl" aria-hidden>
                  💖
                </span>
                <span className="font-bold">Just Us Two</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  setVaultType("squad");
                }}
                className={`toy-btn flex items-center justify-center gap-3 px-5 py-5 text-xl text-[#5b2a4a]
                  ${
                    vaultType === "squad"
                      ? "scale-[1.03] bg-gradient-to-r from-violet-300 to-sky-300"
                      : "bg-white/80"
                  }`}
              >
                <span className="text-3xl" aria-hidden>
                  🦄
                </span>
                <span className="font-bold">Squad (3-4)</span>
              </button>
            </div>
          </section>

          <button
            type="button"
            onClick={goToLock}
            disabled={!clubName.trim()}
            className="toy-btn mx-auto w-full max-w-sm bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-400
              px-6 py-4 text-xl text-white"
          >
            Next — Pick my keys 🔑
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-center text-lg font-bold text-[#5b2a4a]">
            <span className="mr-1" aria-hidden>
              {clubIcon}
            </span>
            {clubName}
          </p>
          <ToyLockbox onLocked={seal} onBack={() => setStep("setup")} />
        </div>
      )}

      <UnlockVaultModal open={vipOpen} onClose={() => setVipOpen(false)} />
      <div className="mt-10">
        <SiteLegalLinks />
      </div>
    </div>
  );
}
