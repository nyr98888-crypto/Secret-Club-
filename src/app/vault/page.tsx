"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isVaultUnlocked,
  readLocalClub,
  setVaultUnlocked,
  type LocalClub,
} from "@/lib/localClub";
import { inviteMessage, nativeShare } from "@/lib/share";
import {
  createScrapbook,
  ensureClubScrapbook,
  readActiveScrapbook,
  readScrapbooks,
  setActiveScrapbookId,
  upsertScrapbook,
  type ScrapbookSpread,
  type StoredScrapbook,
} from "@/lib/scrapbookStore";
import { SecretRoomOpening } from "@/components/SecretRoomOpening";
import { VipUpgradeModal } from "@/components/VipUpgradeModal";
import { VaultTopChrome } from "@/components/VaultTopChrome";
import { ScrapbookCanvas } from "@/components/ScrapbookCanvas";
import { Bookshelf } from "@/components/Bookshelf";
import { NewScrapbookModal } from "@/components/NewScrapbookModal";
import { useScrapbookState } from "@/hooks/useScrapbookState";

type ViewMode = "secret_room" | "scrapbook" | "bookshelf";

export default function VaultPage() {
  const router = useRouter();
  const { backdropTheme, setBackdropTheme } = useScrapbookState();
  const [club, setClub] = useState<LocalClub | null>(null);
  const [ready, setReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("secret_room");
  const [newBookOpen, setNewBookOpen] = useState(false);
  const [inviteToast, setInviteToast] = useState("");
  const [vipOpen, setVipOpen] = useState(false);
  const [book, setBook] = useState<StoredScrapbook | null>(null);
  const [shelf, setShelf] = useState<StoredScrapbook[]>([]);

  const refreshShelf = useCallback(() => {
    setShelf(readScrapbooks());
    setBook(readActiveScrapbook());
  }, []);

  useEffect(() => {
    const existing = readLocalClub();
    if (!existing) {
      router.replace("/");
      return;
    }
    setClub(existing);
    const ensured = ensureClubScrapbook(
      existing.clubName,
      existing.clubIcon || "📒",
    );
    setBook(ensured);
    setShelf(readScrapbooks());
    // Always land in the floating diary room; session unlock only skips re-entry if they just unlocked
    setViewMode(isVaultUnlocked() ? "scrapbook" : "secret_room");
    setReady(true);
  }, [router]);

  const author = useMemo(() => {
    const founder = club?.members.find((m) => m.isFounder) ?? club?.members[0];
    return {
      codeName: founder?.codeName || "You",
      avatarUrl: founder?.avatarUrl || undefined,
      initial: (founder?.codeName || "Y").slice(0, 1),
    };
  }, [club]);

  const persistSpreads = useCallback((spreads: ScrapbookSpread[]) => {
    setBook((prev) => {
      if (!prev) return prev;
      const next = { ...prev, spreads };
      upsertScrapbook(next);
      return next;
    });
  }, []);

  async function handleInvite() {
    if (!club) return;
    const max = club.vaultType === "bestie" ? 2 : 4;
    if (club.members.length >= max) {
      setVipOpen(true);
      return;
    }

    const url =
      typeof window !== "undefined" ? `${window.location.origin}/vault` : "/vault";
    const text = `${inviteMessage(club.clubName, url)}\nPasscode: ${club.passcode.join(" ")}`;
    const result = await nativeShare({
      title: club.clubName,
      text,
      url,
    });
    setInviteToast(
      result === "copied" || result === "shared" ? "Copied! ✨" : "Invite ready ✨",
    );
    window.setTimeout(() => setInviteToast(""), 1800);
  }

  function openBookshelf() {
    refreshShelf();
    setViewMode("bookshelf");
  }

  function lockVault() {
    setVaultUnlocked(false);
    setViewMode("secret_room");
  }

  if (!ready || !club) {
    return (
      <main className="shell">
        <p className="helper">Opening vault…</p>
      </main>
    );
  }

  if (viewMode === "secret_room") {
    return (
      <SecretRoomOpening
        club={club}
        scrapbookName={book?.name}
        scrapbookIcon={book?.themeIcon}
        onUnlocked={() => setViewMode("scrapbook")}
      />
    );
  }

  if (viewMode === "bookshelf") {
    return (
      <main
        className="theme-shell min-h-dvh py-10"
        data-circle={club.vaultType}
        data-aesthetic={club.aesthetic}
      >
        <div className="shell">
          <Bookshelf
            scrapbooks={shelf}
            activeId={book?.id}
            onRefresh={refreshShelf}
            onOpen={(id) => {
              setActiveScrapbookId(id);
              setBook(readActiveScrapbook());
              setViewMode("scrapbook");
            }}
            onCreateNew={() => setNewBookOpen(true)}
          />
          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-pink-500 px-5 py-3 text-sm font-black text-white shadow-md"
              onClick={() => setViewMode("scrapbook")}
            >
              Back to open scrapbook
            </button>
            <button
              type="button"
              className="rounded-full border-2 border-pink-200 bg-white px-5 py-3 text-sm font-black text-pink-600 shadow-sm"
              onClick={lockVault}
            >
              🔒 Lock Vault
            </button>
          </div>
        </div>

        <NewScrapbookModal
          open={newBookOpen}
          onClose={() => setNewBookOpen(false)}
          onRequestVip={() => setVipOpen(true)}
          onCreate={(name, themeIcon) => {
            const created = createScrapbook({ name, themeIcon });
            upsertScrapbook(created);
            setActiveScrapbookId(created.id);
            setNewBookOpen(false);
            refreshShelf();
            setBook(created);
            setViewMode("scrapbook");
          }}
        />
        <VipUpgradeModal open={vipOpen} onClose={() => setVipOpen(false)} />
      </main>
    );
  }

  const inviteWho = club.vaultType === "squad" ? "Squad" : "Bestie";
  const title = book?.name || club.clubName;
  const icon = book?.themeIcon || club.clubIcon || "🍓";
  const darkMood = Boolean(backdropTheme.dark);

  return (
    <main
      className={`theme-shell vault-workspace flex min-h-dvh flex-col transition-all duration-500 ease-out ${
        darkMood ? "vault-mood-dark" : ""
      }`}
      data-circle={club.vaultType}
      data-aesthetic={club.aesthetic}
      data-backdrop={backdropTheme.id}
      style={{ background: backdropTheme.css }}
    >
      <VaultTopChrome
        inviteLabel={`💌 Invite ${inviteWho}`}
        onInvite={handleInvite}
        onBookshelf={openBookshelf}
        onLock={lockVault}
        backdropTheme={backdropTheme}
        onBackdropChange={setBackdropTheme}
      />

      <div className="flex min-h-0 w-full flex-1 flex-col">
        <header
          className={`sticky top-0 z-40 shrink-0 border-b px-4 py-3 backdrop-blur-md transition-all duration-500 ease-out sm:px-6 md:pr-80 xl:pr-[22rem] ${
            darkMood
              ? "border-white/10 bg-slate-950/55"
              : "border-pink-100 bg-white/80"
          }`}
        >
          <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <div className="min-w-0">
              <h1
                className={`m-0 flex items-center gap-2 text-xl font-black tracking-tight ${
                  darkMood ? "text-pink-100" : "text-slate-800"
                }`}
              >
                <span className="text-2xl leading-none" aria-hidden>
                  {icon}
                </span>
                <span className="truncate">{title}</span>
              </h1>
              {inviteToast ? (
                <p className="mt-1 inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-pink-600 shadow-sm">
                  {inviteToast}
                </p>
              ) : null}
            </div>

            <div
              id="header-spread-slot"
              className="flex justify-center md:justify-self-center"
            />

            <div
              id="header-actions-slot"
              className="flex min-w-0 justify-start md:justify-end"
            />
          </div>
        </header>

        {book ? (
          <ScrapbookCanvas
            spreads={book.spreads}
            members={club.members}
            author={author}
            enableAssetDrawer
            onRequestVip={() => setVipOpen(true)}
            onSpreadsChange={persistSpreads}
            className="min-h-0 flex-1"
          />
        ) : null}
      </div>

      <VipUpgradeModal open={vipOpen} onClose={() => setVipOpen(false)} />
    </main>
  );
}
