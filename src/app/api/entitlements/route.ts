import { NextResponse } from "next/server";
import { resolveEntitlement, canCreateVault, canExportPdf } from "@/lib/entitlements";

export async function GET() {
  const ent = await resolveEntitlement();
  const vaults = await canCreateVault();
  const pdf = await canExportPdf();
  return NextResponse.json({
    vip: ent.vipLifetime,
    pdfExportCount: ent.pdfExportCount,
    vaults,
    pdf,
  });
}
