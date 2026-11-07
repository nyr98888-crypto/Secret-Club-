"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isVaultUnlocked,
  readLocalClub,
  setVaultUnlocked,
  type LocalClub,
} from "@/lib/localClub";
import { buildClubInviteShare, nativeShare } from "@/lib/share";
import {
  createScrapbook,
  ensureClubScrapbook,
  isBrandNewShelf,
  readActiveScrapbook,
  readScrapbooks,
  setActiveScrapbookId,
  upsertScrapbook,
  type ScrapbookSpread,
  type StoredScrapbook,
} from "@/lib/scrapbookStore";
import { SecretRoomOpening } from "@/components/SecretRoomOpening";
import { UnlockVaultModal } from "@/components/vault/UnlockVaultModal";
import { useVaultAccess } from "@/hooks/useVaultAccess";
import { activateVIPKey, checkIsVIP } from "@/lib/vipAuth";
import { isVipUnlocked } from "@/hooks/useVipAccess";
import { VaultTopChrome } from "@/components/VaultTopChrome";
import { ScrapbookCanvas } from "@/components/ScrapbookCanvas";
import { Bookshelf } from "@/components/Bookshelf";
import { NewScrapbookModal } from "@/components/NewScrapbookModal";
import { useScrapbookState } from "@/hooks/useScrapbookState";

type ViewMode = "secret_room" | "scrapbook" | "bookshelf";

export default function VaultPage() {
  const router = useRouter();
  const { backdropTheme, setBackdropTheme } = useScrapbookState();
  const { canCreateScrapbook } = useVaultAccess();
  const [club, setClub] = useState<LocalClub | null>(null);
  const [ready, setReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("secret_room");
  const [newBookOpen, setNewBookOpen] = useState(false);
  const [inviteToast, setInviteToast] = useState("");
  const [vipOpen, setVipOpen] = useState(false);
  const [vipHeadline, setVipHeadline] = useState<string | undefined>();
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
    const brandNew = isBrandNewShelf();
    const ensured = ensureClubScrapbook(
      existing.clubName,
      existing.clubIcon || "📒",
    );
    setBook(ensured);
    setShelf(readScrapbooks());

    // VIP `?vip=` → activate, bypass passcode, clean URL
    try {
      const urlKey = new URLSearchParams(window.location.search).get("vip");
      if (urlKey && activateVIPKey(urlKey)) {
        setVaultUnlocked(true);
        setViewMode("scrapbook");
        setReady(true);
        const clean = new URL(window.location.href);
        clean.searchParams.delete("vip");
        window.history.replaceState(
          window.history.state,
          "",
          `${clean.pathname}${clean.search}${clean.hash}`,
        );
        return;
      }
    } catch {
      /* ignore */
    }

    // Stored VIP, first-time shelf, or already unlocked → skip passcode
    if (brandNew || isVaultUnlocked() || isVipUnlocked() || checkIsVIP()) {
      setVaultUnlocked(true);
      setViewMode("scrapbook");
    } else {
      setViewMode("secret_room");
    }
    setReady(true);
  }, [router]);

  // If a VIP key unlocks after mount (URL bootstrap), skip the secret room
  useEffect(() => {
    function enterScrapbookFromVip() {
      if (!isVipUnlocked()) return;
      setVaultUnlocked(true);
      setViewMode((mode) => (mode === "secret_room" ? "scrapbook" : mode));
    }
    window.addEventListener("sc:vault-unlocked", enterScrapbookFromVip);
    enterScrapbookFromVip();
    return () =>
      window.removeEventListener("sc:vault-unlocked", enterScrapbookFromVip);
  }, []);

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

  function openVip(headline?: string) {
    setVipHeadline(headline);
    setVipOpen(true);
  }

  function closeVip() {
    setVipOpen(false);
    setVipHeadline(undefined);
  }

  async function handleInvite() {
    if (!club) return;
    const max = club.vaultType === "bestie" ? 2 : 4;
    if (club.members.length >= max) {
      openVip();
      return;
    }

    const payload = buildClubInviteShare({
      clubName: club.clubName,
      clubId: club.createdAt || club.clubName,
      passcode: club.passcode,
    });
    const result = await nativeShare(payload);
    setInviteToast(
      result === "copied"
        ? "Copied invite link! 💌"
        : result === "shared"
          ? "Invite sent! 💌"
          : "Invite ready 💌",
    );
    window.setTimeout(() => setInviteToast(""), 2200);
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
        className="theme-shell vault-workspace min-h-dvh py-10 transition-all duration-500 ease-out"
        data-circle={club.vaultType}
        data-aesthetic={club.aesthetic}
        data-backdrop={backdropTheme.id}
        style={{
          backgroundImage:
            backdropTheme.css ||
            "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
        }}
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
            onDeleted={(nextActiveId) => {
              refreshShelf();
              if (nextActiveId) {
                setActiveScrapbookId(nextActiveId);
                setBook(readActiveScrapbook());
              } else {
                setBook(null);
              }
            }}
            onCreateNew={() => {
              if (!canCreateScrapbook(shelf.length)) {
                openVip();
                return;
              }
              setNewBookOpen(true);
            }}
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
          onRequestVip={() => openVip()}
          onCreate={(name, themeIcon) => {
            if (!canCreateScrapbook(shelf.length)) {
              openVip();
              return;
            }
            const created = createScrapbook({ name, themeIcon });
            upsertScrapbook(created);
            setActiveScrapbookId(created.id);
            setNewBookOpen(false);
            refreshShelf();
            setBook(created);
            setViewMode("scrapbook");
          }}
        />
        <UnlockVaultModal
          open={vipOpen}
          headline={vipHeadline}
          onClose={closeVip}
          onUnlocked={closeVip}
        />
      </main>
    );
  }

  const inviteWho = club.vaultType === "squad" ? "Squad" : "Bestie";
  const title = book?.name || club.clubName;
  const icon = book?.themeIcon || club.clubIcon || "🍓";
  const darkMood = Boolean(backdropTheme.dark);

  return (
    <div
      className={`theme-shell vault-workspace flex h-screen w-screen flex-col overflow-hidden transition-all duration-500 ease-out ${
        darkMood ? "vault-mood-dark" : ""
      }`}
      data-circle={club.vaultType}
      data-aesthetic={club.aesthetic}
      data-backdrop={backdropTheme.id}
      style={{
        backgroundImage:
          backdropTheme.css ||
          "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
        backgroundColor: "#FDE2EC",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
      }}
    >
      <VaultTopChrome
        inviteLabel={`💌 Invite ${inviteWho}`}
        onInvite={handleInvite}
        onBookshelf={openBookshelf}
        onLock={lockVault}
        onRequestVip={() => openVip()}
        backdropTheme={backdropTheme}
        onBackdropChange={setBackdropTheme}
      />

      {/* 1. Global Header Bar */}
      <header
        className={`print-hide z-20 flex h-16 w-full shrink-0 items-center justify-between border-b px-4 backdrop-blur sm:px-6 ${
          darkMood
            ? "border-white/10 bg-slate-950/80"
            : "border-pink-100 bg-white/80"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <h1
            className={`club-title m-0 flex min-w-0 items-center gap-1.5 text-base font-bold sm:gap-2 sm:text-xl ${
              darkMood ? "text-pink-100" : "text-[#2D0C1E]"
            }`}
          >
            <span className="shrink-0 text-xl leading-none sm:text-2xl" aria-hidden>
              {icon}
            </span>
            <span className="truncate">{title}</span>
          </h1>
          <span
            className="club-header-badge hidden max-w-[12rem] items-center truncate rounded-full bg-white px-2.5 py-0.5 text-[13px] font-bold text-[#2D0C1E] shadow-[0_2px_6px_rgba(45,12,30,0.12)] sm:inline-flex"
            style={{ border: "1.5px solid #2D0C1E" }}
            title={
              title.trim().toLowerCase() === club.clubName.trim().toLowerCase()
                ? club.vaultType === "squad"
                  ? "Squad Vault"
                  : "Bestie Vault"
                : club.clubName
            }
          >
            {title.trim().toLowerCase() === club.clubName.trim().toLowerCase()
              ? club.vaultType === "squad"
                ? "🛡️ Squad Vault"
                : "💖 Bestie Vault"
              : club.clubName}
          </span>
          {inviteToast ? (
            <span
              role="status"
              className="inline-flex max-w-[10rem] truncate rounded-full bg-[#2D0C1E] px-2.5 py-0.5 text-[13px] font-bold text-white"
            >
              {inviteToast}
            </span>
          ) : null}
        </div>
        <div
          id="header-actions-slot"
          className="flex shrink-0 items-center justify-end gap-3"
        />
      </header>

      {/* 2. Main Workspace (Canvas + Sidebar) */}
      <main className="relative flex min-h-0 w-full flex-1 overflow-hidden">
        {book ? (
          <ScrapbookCanvas
            spreads={book.spreads}
            members={club.members}
            author={author}
            enableAssetDrawer
            onRequestVip={(headline) => openVip(headline)}
            onSpreadsChange={persistSpreads}
            className="min-h-0 flex-1"
          />
        ) : null}
      </main>

      <UnlockVaultModal
        open={vipOpen}
        headline={vipHeadline}
        onClose={closeVip}
        onUnlocked={closeVip}
      />
    </div>
  );
}
