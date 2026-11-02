import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { buildPrefixHashes, hmacPasscode, normalizeGlyphs } from "@/lib/passcode";
import { canCreateVault } from "@/lib/entitlements";
import { createMemberSession, getOrCreateBrowserId } from "@/lib/session";
import { mutateStore } from "@/lib/store";
import type { Aesthetic, CircleMode } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name || "").trim().slice(0, 48);
  const aesthetic = body.aesthetic as Aesthetic;
  const circleMode = body.circleMode as CircleMode;
  const codeName = String(body.codeName || "").trim().slice(0, 24);
  const glyphs = normalizeGlyphs(body.glyphs || []);
  const photoBlobUrl = body.photoBlobUrl ? String(body.photoBlobUrl) : null;

  if (!name || !codeName || glyphs.length !== 3) {
    return NextResponse.json({ error: "Invalid club payload" }, { status: 400 });
  }
  if (!["bestie", "squad"].includes(circleMode)) {
    return NextResponse.json({ error: "Invalid circle mode" }, { status: 400 });
  }
  if (
    ![
      "retro_y2k",
      "kawaii_pastel",
      "goth_cottagecore",
      "cyber_pixel",
    ].includes(aesthetic)
  ) {
    return NextResponse.json({ error: "Invalid aesthetic" }, { status: 400 });
  }

  const vaultCheck = await canCreateVault();
  if (!vaultCheck.allowed) {
    return NextResponse.json(
      {
        error: "vault_limit",
        message: "VIP unlocks up to 5 vaults",
        vipRequired: true,
      },
      { status: 402 },
    );
  }

  const browserId = await getOrCreateBrowserId();
  const clubId = nanoid(12);
  const memberId = nanoid(12);
  const slug = nanoid(10).toLowerCase();

  const club = {
    id: clubId,
    slug,
    name,
    aesthetic,
    circleMode,
    passcodeHash: hmacPasscode(glyphs),
    prefixHashes: buildPrefixHashes(glyphs),
    sealSeed: nanoid(8),
    ownerBrowserId: browserId,
    createdAt: new Date().toISOString(),
  };

  const member = {
    id: memberId,
    clubId,
    codeName,
    photoBlobUrl,
    isFounder: true,
    joinedAt: new Date().toISOString(),
  };

  await mutateStore((store) => {
    store.clubs.push(club);
    store.members.push(member);
  });

  await createMemberSession(memberId, clubId);

  return NextResponse.json({
    club: {
      id: club.id,
      slug: club.slug,
      name: club.name,
      aesthetic: club.aesthetic,
      circleMode: club.circleMode,
      sealSeed: club.sealSeed,
      createdAt: club.createdAt,
    },
    member,
    joinPath: `/join/${slug}`,
  });
}
