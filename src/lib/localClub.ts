import type { Aesthetic } from "./types";

export const LOCAL_CLUB_KEY = "sc_local_club";
export const LOCAL_UNLOCK_KEY = "sc_vault_unlocked";
export const PASSCODE_LENGTH = 3;

export type VaultType = "bestie" | "squad";

export type LocalMember = {
  id: string;
  codeName: string;
  avatarUrl?: string | null;
  isFounder?: boolean;
};

/** LocalStorage club blob */
export type LocalClub = {
  clubName: string;
  /** Emoji mascot from the name slot machine */
  clubIcon?: string;
  aesthetic: Aesthetic;
  vaultType: VaultType;
  passcode: [string, string, string];
  createdAt: string;
  members: LocalMember[];
};

export function maxMembersFor(vaultType: VaultType): number {
  return vaultType === "bestie" ? 2 : 4;
}

export function minMembersFor(vaultType: VaultType): number {
  return vaultType === "bestie" ? 2 : 3;
}

export function openMemberSlots(club: LocalClub): number {
  return Math.max(0, maxMembersFor(club.vaultType) - club.members.length);
}

export function canAddMember(club: LocalClub): boolean {
  return club.members.length < maxMembersFor(club.vaultType);
}

function isVaultType(v: unknown): v is VaultType {
  return v === "bestie" || v === "squad";
}

function isAesthetic(v: unknown): v is Aesthetic {
  return (
    v === "retro_y2k" ||
    v === "kawaii_pastel" ||
    v === "goth_cottagecore" ||
    v === "cyber_pixel"
  );
}

export function isValidPasscode(glyphs: string[]): glyphs is [string, string, string] {
  return (
    glyphs.length === PASSCODE_LENGTH &&
    glyphs.every((g) => typeof g === "string" && g.trim().length > 0)
  );
}

export function passcodesMatch(a: string[], b: string[]): boolean {
  if (a.length !== PASSCODE_LENGTH || b.length !== PASSCODE_LENGTH) return false;
  return a.every((g, i) => g === b[i]);
}

export function createLocalClub(input: {
  clubName: string;
  clubIcon?: string;
  aesthetic: Aesthetic;
  vaultType: VaultType;
  passcode: [string, string, string];
  founder?: Pick<LocalMember, "codeName" | "avatarUrl">;
}): LocalClub {
  const founder: LocalMember | null = input.founder?.codeName.trim()
    ? {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `m-${Date.now()}`,
        codeName: input.founder.codeName.trim().slice(0, 24),
        avatarUrl: input.founder.avatarUrl ?? null,
        isFounder: true,
      }
    : null;

  return {
    clubName: input.clubName.trim().slice(0, 48),
    clubIcon: input.clubIcon,
    aesthetic: input.aesthetic,
    vaultType: input.vaultType,
    passcode: input.passcode,
    createdAt: new Date().toISOString(),
    members: founder ? [founder] : [],
  };
}

export function readLocalClub(): LocalClub | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_CLUB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalClub>;
    if (
      !parsed.clubName ||
      !isAesthetic(parsed.aesthetic) ||
      !isVaultType(parsed.vaultType) ||
      !Array.isArray(parsed.passcode) ||
      !isValidPasscode(parsed.passcode)
    ) {
      return null;
    }
    return {
      clubName: String(parsed.clubName),
      clubIcon: parsed.clubIcon ? String(parsed.clubIcon) : undefined,
      aesthetic: parsed.aesthetic,
      vaultType: parsed.vaultType,
      passcode: parsed.passcode,
      createdAt: String(parsed.createdAt || new Date().toISOString()),
      members: Array.isArray(parsed.members) ? parsed.members : [],
    };
  } catch {
    return null;
  }
}

export function saveLocalClub(club: LocalClub): void {
  localStorage.setItem(LOCAL_CLUB_KEY, JSON.stringify(club));
}

export function clearLocalClub(): void {
  localStorage.removeItem(LOCAL_CLUB_KEY);
  sessionStorage.removeItem(LOCAL_UNLOCK_KEY);
}

export function isVaultUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(LOCAL_UNLOCK_KEY) === "1";
}

export function setVaultUnlocked(on: boolean): void {
  if (on) sessionStorage.setItem(LOCAL_UNLOCK_KEY, "1");
  else sessionStorage.removeItem(LOCAL_UNLOCK_KEY);
}

export function verifyLocalPasscode(glyphs: string[]): boolean {
  const club = readLocalClub();
  if (!club) return false;
  return passcodesMatch(glyphs, club.passcode);
}
