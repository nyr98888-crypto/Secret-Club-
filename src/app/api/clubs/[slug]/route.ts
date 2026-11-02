import { NextResponse } from "next/server";
import { getSessionForClub } from "@/lib/session";
import {
  dropsForClub,
  findClubBySlug,
  membersForClub,
} from "@/lib/store";
import { resolveEntitlement } from "@/lib/entitlements";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const club = await findClubBySlug(slug);
  if (!club) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getSessionForClub(club.id);
  const ent = await resolveEntitlement();

  if (!session) {
    return NextResponse.json({
      locked: true,
      club: {
        id: club.id,
        slug: club.slug,
        name: club.name,
        aesthetic: club.aesthetic,
        circleMode: club.circleMode,
        sealSeed: club.sealSeed,
        createdAt: club.createdAt,
      },
      vip: ent.vipLifetime,
    });
  }

  const members = await membersForClub(club.id);
  const drops = await dropsForClub(club.id);

  return NextResponse.json({
    locked: false,
    club: {
      id: club.id,
      slug: club.slug,
      name: club.name,
      aesthetic: club.aesthetic,
      circleMode: club.circleMode,
      sealSeed: club.sealSeed,
      createdAt: club.createdAt,
    },
    member: session.member,
    members,
    drops,
    vip: ent.vipLifetime,
  });
}
