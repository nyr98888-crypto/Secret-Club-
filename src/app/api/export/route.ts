import { NextResponse } from "next/server";
import { canExportPdf, recordPdfExport } from "@/lib/entitlements";

export async function POST() {
  const check = await canExportPdf();
  if (!check.allowed) {
    return NextResponse.json(
      { error: "pdf_limit", vipRequired: true },
      { status: 402 },
    );
  }
  await recordPdfExport();
  return NextResponse.json({
    ok: true,
    watermark: !check.vip,
    vip: check.vip,
  });
}
