import { NextResponse } from "next/server";
import {
  issueLicenseProofToken,
  issueVipLicense,
  validateExternalOrLocalLicense,
  verifyVipLicense,
} from "@/lib/license";
import { getOrCreateBrowserId, setVipCookie } from "@/lib/session";
import { getEntitlement, upsertEntitlement } from "@/lib/store";

/**
 * POST { licenseKey, email? }
 * Verifies license (local HMAC scvip_ keys and/or Lemon Squeezy),
 * grants VIP for this browser, and returns a signed HMAC proof token.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      licenseKey?: string;
      email?: string;
    };
    const licenseKey = body.licenseKey?.trim() || "";
    const email = body.email?.trim() || "";

    if (!licenseKey || licenseKey.length < 8) {
      return NextResponse.json(
        { valid: false, error: "Invalid license key" },
        { status: 400 },
      );
    }

    const browserId = await getOrCreateBrowserId();
    const check = await validateExternalOrLocalLicense(licenseKey, browserId);
    if (!check.valid) {
      return NextResponse.json(
        { valid: false, error: "Invalid license key", reason: check.reason },
        { status: 400 },
      );
    }

    const current = await getEntitlement(browserId);
    const storedKey =
      check.local?.ok
        ? licenseKey
        : current.licenseKey &&
            verifyVipLicense(current.licenseKey, browserId).ok
          ? current.licenseKey
          : issueVipLicense(browserId).key;

    await upsertEntitlement({
      ...current,
      browserId,
      vipLifetime: true,
      licenseKey: storedKey,
      purchasedAt: current.purchasedAt ?? new Date().toISOString(),
    });
    await setVipCookie(browserId);

    const { token, timestamp } = issueLicenseProofToken(licenseKey, email);

    return NextResponse.json({
      valid: true,
      ok: true,
      vip: true,
      token,
      timestamp,
      browserId,
    });
  } catch (err) {
    console.error("license verify failed", err);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}

/** GET — soft check: is this browser VIP? */
export async function GET() {
  const browserId = await getOrCreateBrowserId();
  const row = await getEntitlement(browserId);
  let licenseOk = false;
  if (row.licenseKey) {
    licenseOk = verifyVipLicense(row.licenseKey, browserId).ok;
  }
  return NextResponse.json({
    browserId,
    vip: Boolean(row.vipLifetime || licenseOk),
    hasLicense: Boolean(row.licenseKey),
  });
}
