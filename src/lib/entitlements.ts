import {
  countVaultsForBrowser,
  getEntitlement,
  upsertEntitlement,
} from "./store";
import { getOrCreateBrowserId, readVipCookie, setVipCookie } from "./session";

export const FREE_VAULT_LIMIT = 1;
export const VIP_VAULT_LIMIT = 5;
export const FREE_PDF_LIMIT = 1;

export async function resolveEntitlement() {
  const browserId = await getOrCreateBrowserId();
  const row = await getEntitlement(browserId);
  const cookieVip = await readVipCookie();
  const vipLifetime = row.vipLifetime || cookieVip;
  return { ...row, browserId, vipLifetime };
}

export async function grantVip(opts: {
  browserId: string;
  sessionId?: string;
  customerId?: string | null;
}) {
  const current = await getEntitlement(opts.browserId);
  const next = await upsertEntitlement({
    ...current,
    browserId: opts.browserId,
    vipLifetime: true,
    stripeCheckoutSessionId:
      opts.sessionId ?? current.stripeCheckoutSessionId,
    stripeCustomerId: opts.customerId ?? current.stripeCustomerId,
    purchasedAt: new Date().toISOString(),
  });
  await setVipCookie(opts.browserId);
  return next;
}

export async function canCreateVault() {
  const ent = await resolveEntitlement();
  const count = await countVaultsForBrowser(ent.browserId);
  const limit = ent.vipLifetime ? VIP_VAULT_LIMIT : FREE_VAULT_LIMIT;
  return {
    allowed: count < limit,
    count,
    limit,
    vip: ent.vipLifetime,
    browserId: ent.browserId,
  };
}

export async function canExportPdf() {
  const ent = await resolveEntitlement();
  if (ent.vipLifetime) {
    return { allowed: true, remaining: Infinity, vip: true, ent };
  }
  const remaining = Math.max(0, FREE_PDF_LIMIT - ent.pdfExportCount);
  return { allowed: remaining > 0, remaining, vip: false, ent };
}

export async function recordPdfExport() {
  const ent = await resolveEntitlement();
  return upsertEntitlement({
    ...ent,
    pdfExportCount: ent.pdfExportCount + 1,
  });
}
