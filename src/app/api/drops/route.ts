import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSessionForClub } from "@/lib/session";
import { findClubBySlug, mutateStore } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json();
  const slug = String(body.slug || "");
  const bodyText = String(body.bodyText || "").trim().slice(0, 2000);
  const imageBlobUrl = body.imageBlobUrl ? String(body.imageBlobUrl) : null;

  if (!slug || !bodyText) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const club = await findClubBySlug(slug);
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const session = await getSessionForClub(club.id);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drop = {
    id: nanoid(12),
    clubId: club.id,
    authorMemberId: session.member.id,
    kind: "locked_note" as const,
    bodyText,
    imageBlobUrl,
    createdAt: new Date().toISOString(),
  };

  await mutateStore((store) => {
    store.drops.push(drop);
  });

  return NextResponse.json({
    drop,
    path: `/d/${drop.id}`,
  });
}
