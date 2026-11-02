import { createHmac, timingSafeEqual, randomBytes } from "crypto";

/**
 * HMAC-SHA256 lifetime VIP license keys.
 * Format: scvip_<payloadB64url>.<sigHex>
 * Payload: browserId|issuedAt|nonce
 */

const PREFIX = "scvip_";

function licenseSecret(): string {
  const secret =
    process.env.LICENSE_SIGNING_SECRET ||
    process.env.LICENSE_SECRET ||
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === "production"
      ? ""
      : "dev-license-secret-change-me");
  if (!secret) {
    throw new Error(
      "LICENSE_SIGNING_SECRET (or LICENSE_SECRET / AUTH_SECRET) is required in production",
    );
  }
  return secret;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string): string {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

function signPayload(payload: string): string {
  return createHmac("sha256", licenseSecret()).update(payload).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export type IssuedLicense = {
  key: string;
  browserId: string;
  issuedAt: string;
};

/** Mint a tamper-evident lifetime VIP license for this browser. */
export function issueVipLicense(browserId: string): IssuedLicense {
  const issuedAt = new Date().toISOString();
  const nonce = randomBytes(8).toString("hex");
  const payload = `${browserId}|${issuedAt}|${nonce}`;
  const sig = signPayload(payload);
  const key = `${PREFIX}${b64url(payload)}.${sig}`;
  return { key, browserId, issuedAt };
}

export type LicenseVerifyResult =
  | { ok: true; browserId: string; issuedAt: string }
  | { ok: false; reason: string };

/** Verify an HMAC VIP license. Optionally require it matches this browser. */
export function verifyVipLicense(
  key: string,
  expectedBrowserId?: string,
): LicenseVerifyResult {
  if (!key || typeof key !== "string") {
    return { ok: false, reason: "missing_key" };
  }
  if (!key.startsWith(PREFIX)) {
    return { ok: false, reason: "invalid_prefix" };
  }

  const body = key.slice(PREFIX.length);
  const dot = body.lastIndexOf(".");
  if (dot < 1) return { ok: false, reason: "malformed" };

  const payloadB64 = body.slice(0, dot);
  const sig = body.slice(dot + 1);
  let payload: string;
  try {
    payload = fromB64url(payloadB64);
  } catch {
    return { ok: false, reason: "bad_payload" };
  }

  const expectedSig = signPayload(payload);
  if (!safeEqualHex(sig, expectedSig)) {
    return { ok: false, reason: "bad_signature" };
  }

  const [browserId, issuedAt] = payload.split("|");
  if (!browserId || !issuedAt) {
    return { ok: false, reason: "incomplete_payload" };
  }
  if (expectedBrowserId && browserId !== expectedBrowserId) {
    return { ok: false, reason: "browser_mismatch" };
  }

  return { ok: true, browserId, issuedAt };
}

/** Client-facing HMAC proof: `email:licenseKey:timestamp.signature` */
export function issueLicenseProofToken(
  licenseKey: string,
  email?: string | null,
): { token: string; timestamp: number } {
  const timestamp = Date.now();
  const payload = `${email?.trim() || "user"}:${licenseKey}:${timestamp}`;
  const signature = createHmac("sha256", licenseSecret())
    .update(payload)
    .digest("hex");
  return { token: `${payload}.${signature}`, timestamp };
}

export function verifyLicenseProofToken(token: string): boolean {
  if (!token || !token.includes(".")) return false;
  const dot = token.lastIndexOf(".");
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = createHmac("sha256", licenseSecret())
    .update(payload)
    .digest("hex");
  return safeEqualHex(signature, expected);
}

/**
 * Accept either our scvip_ HMAC keys or a Lemon Squeezy license (live API).
 * Falls back to format check only in development when no LS key is configured.
 */
export async function validateExternalOrLocalLicense(
  licenseKey: string,
  expectedBrowserId?: string,
): Promise<{ valid: boolean; reason?: string; local?: LicenseVerifyResult }> {
  const key = licenseKey.trim();
  if (!key || key.length < 8) {
    return { valid: false, reason: "too_short" };
  }

  // Local HMAC vault keys
  if (key.startsWith(PREFIX)) {
    const local = verifyVipLicense(key, expectedBrowserId);
    return local.ok
      ? { valid: true, local }
      : { valid: false, reason: local.reason, local };
  }

  // Optional Lemon Squeezy live validation
  const lsKey = process.env.LEMON_SQUEEZY_API_KEY;
  const lsStore = process.env.LEMON_SQUEEZY_STORE_ID;
  if (lsKey) {
    try {
      const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${lsKey}`,
        },
        body: JSON.stringify({
          license_key: key,
          ...(lsStore ? { store_id: Number(lsStore) } : {}),
        }),
      });
      const data = (await res.json()) as { valid?: boolean; error?: string };
      if (res.ok && data.valid) return { valid: true };
      return { valid: false, reason: data.error || "lemon_squeezy_invalid" };
    } catch {
      return { valid: false, reason: "lemon_squeezy_unreachable" };
    }
  }

  // Dev-only soft format accept for non-scvip keys when Stripe/LS aren't wired
  if (process.env.NODE_ENV !== "production") {
    return { valid: true };
  }

  return { valid: false, reason: "unrecognized_key" };
}
