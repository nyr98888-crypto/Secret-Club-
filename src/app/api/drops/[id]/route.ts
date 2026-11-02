import { NextResponse } from "next/server";
import { findClubById, findDropById } from "@/lib/store";
import { getSessionForClub } from "@/lib/session";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const drop = await findDropById(id);
  if (!drop) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const club = await findClubById(drop.clubId);
  if (!club) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getSessionForClub(club.id);
  return NextResponse.json({
    locked: !session,
    club: {
      id: club.id,
      slug: club.slug,
      name: club.name,
      aesthetic: club.aesthetic,
      circleMode: club.circleMode,
      sealSeed: club.sealSeed,
      createdAt: club.createdAt,
    },
    dropMeta: {
      id: drop.id,
      createdAt: drop.createdAt,
    },
    drop: session
      ? {
          id: drop.id,
          bodyText: drop.bodyText,
          imageBlobUrl: drop.imageBlobUrl,
          createdAt: drop.createdAt,
          authorMemberId: drop.authorMemberId,
        }
      : null,
    member: session?.member ?? null,
  });
}
