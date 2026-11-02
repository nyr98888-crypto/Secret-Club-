import { NextResponse } from "next/server";
import { checkPrefix, normalizeGlyphs } from "@/lib/passcode";
import { createMemberSession, getSessionForClub } from "@/lib/session";
import {
  dropsForClub,
  findClubBySlug,
  findDropById,
  membersForClub,
  mutateStore,
} from "@/lib/store";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const body = await req.json();
  const glyphs = normalizeGlyphs(body.glyphs || []);
  const slug = body.slug ? String(body.slug) : null;
  const dropId = body.dropId ? String(body.dropId) : null;
  const codeName = body.codeName ? String(body.codeName).trim().slice(0, 24) : "";
  const photoBlobUrl = body.photoBlobUrl ? String(body.photoBlobUrl) : null;

  let club = slug ? await findClubBySlug(slug) : null;
  const drop = dropId ? await findDropById(dropId) : null;
  if (drop && !club) {
    const { findClubById } = await import("@/lib/store");
    club = await findClubById(drop.clubId);
  }
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const status = checkPrefix(glyphs, club.prefixHashes);
  if (status === "wrong") {
    return NextResponse.json({ status: "wrong" });
  }
  if (status === "partial") {
    return NextResponse.json({ status: "partial" });
  }

  // complete
  const session = await getSessionForClub(club.id);
  let member = session?.member ?? null;

  if (!member) {
    if (!codeName) {
      return NextResponse.json({
        status: "complete",
        needsProfile: true,
        club: publicClub(club),
      });
    }
    const memberId = nanoid(12);
    member = {
      id: memberId,
      clubId: club.id,
      codeName,
      photoBlobUrl,
      isFounder: false,
      joinedAt: new Date().toISOString(),
    };
    await mutateStore((store) => {
      store.members.push(member!);
    });
    await createMemberSession(member.id, club.id);
  }

  const members = await membersForClub(club.id);
  const drops = await dropsForClub(club.id);

  return NextResponse.json({
    status: "complete",
    needsProfile: false,
    club: publicClub(club),
    member,
    members,
    drops: drop
      ? drops
      : drops.map((d) => ({
          id: d.id,
          clubId: d.clubId,
          authorMemberId: d.authorMemberId,
          kind: d.kind,
          bodyText: d.bodyText,
          imageBlobUrl: d.imageBlobUrl,
          createdAt: d.createdAt,
        })),
    focusDrop: drop
      ? {
          id: drop.id,
          bodyText: drop.bodyText,
          imageBlobUrl: drop.imageBlobUrl,
          createdAt: drop.createdAt,
          authorMemberId: drop.authorMemberId,
        }
      : null,
  });
}

function publicClub(club: {
  id: string;
  slug: string;
  name: string;
  aesthetic: string;
  circleMode: string;
  sealSeed: string;
  createdAt: string;
}) {
  return {
    id: club.id,
    slug: club.slug,
    name: club.name,
    aesthetic: club.aesthetic,
    circleMode: club.circleMode,
    sealSeed: club.sealSeed,
    createdAt: club.createdAt,
  };
}
