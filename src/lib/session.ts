import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { mutateStore, getStore } from "./store";

const BROWSER_COOKIE = "sc_browser";
const SESSION_COOKIE = "sc_session";
const VIP_COOKIE = "sc_vip";

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is required in production");
    }
    return new TextEncoder().encode("dev-auth-secret-change-me");
  }
  return new TextEncoder().encode(secret);
}

export async function getOrCreateBrowserId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(BROWSER_COOKIE)?.value;
  if (existing) return existing;
  const id = nanoid(24);
  jar.set(BROWSER_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });
  return id;
}

export async function createMemberSession(memberId: string, clubId: string) {
  const token = nanoid(32);
  await mutateStore((store) => {
    store.sessions.push({
      token,
      memberId,
      clubId,
      createdAt: new Date().toISOString(),
    });
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return token;
}

export async function getSessionForClub(clubId: string) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const store = await getStore();
  const session = store.sessions.find(
    (s) => s.token === token && s.clubId === clubId,
  );
  if (!session) return null;
  const member = store.members.find((m) => m.id === session.memberId) ?? null;
  return member ? { session, member } : null;
}

export async function setVipCookie(browserId: string) {
  const token = await new SignJWT({ browserId, vip: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5y")
    .sign(secretKey());
  const jar = await cookies();
  jar.set(VIP_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });
}

export async function readVipCookie(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(VIP_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.vip !== true) return false;
    // Bind VIP cookie to this browser id so stolen cookies can't unlock others
    const browserId = jar.get(BROWSER_COOKIE)?.value;
    if (
      browserId &&
      typeof payload.browserId === "string" &&
      payload.browserId !== browserId
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
