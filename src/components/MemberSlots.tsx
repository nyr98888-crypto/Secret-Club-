"use client";

import {
  maxMembersFor,
  openMemberSlots,
  type LocalClub,
  type LocalMember,
} from "@/lib/localClub";

function AvatarBubble({
  member,
}: {
  member: LocalMember;
}) {
  const letter = member.codeName.trim().slice(0, 1).toUpperCase() || "?";
  if (member.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatarUrl}
        alt={member.codeName}
        title={member.codeName}
        className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-md"
      />
    );
  }
  return (
    <span
      title={member.codeName}
      className="inline-grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-pink-400 to-violet-400 text-sm font-bold text-white ring-2 ring-white shadow-md"
    >
      {letter}
    </span>
  );
}

export function MemberSlots({
  club,
}: {
  club: LocalClub;
  /** @deprecated Invite lives in the top-chrome "Invite Bestie" pill */
  onInvite?: () => void;
}) {
  const open = openMemberSlots(club);
  const max = maxMembersFor(club.vaultType);

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={`Members ${club.members.length} of ${max}`}>
      {club.members.map((m) => (
        <AvatarBubble key={m.id} member={m} />
      ))}
      {Array.from({ length: open }).map((_, i) => (
        <span
          key={`slot-${i}`}
          className="inline-grid h-10 w-10 place-items-center rounded-full border-2 border-dashed
            border-pink-200/80 bg-white/30 text-sm font-bold text-pink-300"
          aria-label="Open seat"
          title="Open seat — use Invite Bestie to share"
        >
          ○
        </span>
      ))}
    </div>
  );
}
