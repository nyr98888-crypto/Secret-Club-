import { promises as fs } from "fs";
import path from "path";
import type {
  BrowserEntitlement,
  Club,
  DeviceSession,
  Drop,
  Member,
} from "./types";

type StoreShape = {
  clubs: Club[];
  members: Member[];
  drops: Drop[];
  sessions: DeviceSession[];
  entitlements: BrowserEntitlement[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

const emptyStore = (): StoreShape => ({
  clubs: [],
  members: [],
  drops: [],
  sessions: [],
  entitlements: [],
});

let memory = emptyStore();
let loaded = false;
let writeQueue: Promise<void> = Promise.resolve();

async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    memory = { ...emptyStore(), ...JSON.parse(raw) };
  } catch {
    memory = emptyStore();
  }
  loaded = true;
}

async function persist() {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(memory, null, 2), "utf8");
  });
  await writeQueue;
}

export async function getStore(): Promise<StoreShape> {
  await ensureLoaded();
  return memory;
}

export async function mutateStore<T>(
  fn: (store: StoreShape) => T | Promise<T>,
): Promise<T> {
  await ensureLoaded();
  const result = await fn(memory);
  await persist();
  return result;
}

export async function findClubBySlug(slug: string) {
  const store = await getStore();
  return store.clubs.find((c) => c.slug === slug) ?? null;
}

export async function findClubById(id: string) {
  const store = await getStore();
  return store.clubs.find((c) => c.id === id) ?? null;
}

export async function findDropById(id: string) {
  const store = await getStore();
  return store.drops.find((d) => d.id === id) ?? null;
}

export async function membersForClub(clubId: string) {
  const store = await getStore();
  return store.members.filter((m) => m.clubId === clubId);
}

export async function dropsForClub(clubId: string) {
  const store = await getStore();
  return store.drops
    .filter((d) => d.clubId === clubId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function countVaultsForBrowser(browserId: string) {
  const store = await getStore();
  return store.clubs.filter((c) => c.ownerBrowserId === browserId).length;
}

export async function getEntitlement(
  browserId: string,
): Promise<BrowserEntitlement> {
  const store = await getStore();
  const existing = store.entitlements.find((e) => e.browserId === browserId);
  if (existing) return existing;
  return {
    browserId,
    vipLifetime: false,
    stripeCustomerId: null,
    stripeCheckoutSessionId: null,
    purchasedAt: null,
    pdfExportCount: 0,
    licenseKey: null,
  };
}

export async function upsertEntitlement(
  next: BrowserEntitlement,
): Promise<BrowserEntitlement> {
  return mutateStore((store) => {
    const idx = store.entitlements.findIndex(
      (e) => e.browserId === next.browserId,
    );
    if (idx >= 0) store.entitlements[idx] = next;
    else store.entitlements.push(next);
    return next;
  });
}
