"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { UnlockGate } from "@/components/UnlockGate";
import { VaultShell } from "@/components/VaultShell";
import type { Drop, Member, PublicClub } from "@/lib/types";

export default function JoinPage() {
  const params = useParams<{ token: string }>();
  const slug = params.token;
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(true);
  const [club, setClub] = useState<PublicClub | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [vip, setVip] = useState(false);
  const [error, setError] = useState("");

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return `/join/${slug}`;
    return `${window.location.origin}/join/${slug}`;
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/clubs/${slug}`);
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError("This vault link wasn’t found.");
          return;
        }
        if (cancelled) return;
        setClub(data.club);
        setVip(!!data.vip);
        if (data.locked) {
          setLocked(true);
        } else {
          setLocked(false);
          setMember(data.member);
          setMembers(data.members || []);
          setDrops(data.drops || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="shell">
        <p>Opening vault seal…</p>
      </main>
    );
  }

  if (error || !club) {
    return (
      <main className="shell">
        <p className="error">{error || "Missing club"}</p>
      </main>
    );
  }

  if (locked || !member) {
    return (
      <main
        className="shell theme-shell"
        data-aesthetic={club.aesthetic}
        data-circle={club.circleMode}
      >
        <UnlockGate
          club={club}
          vaultUrl={joinUrl}
          onUnlocked={(payload) => {
            if (payload.club) setClub(payload.club as PublicClub);
            if (payload.member) setMember(payload.member as Member);
            if (payload.members) setMembers(payload.members as Member[]);
            if (payload.drops) setDrops(payload.drops as Drop[]);
            setLocked(false);
          }}
        />
      </main>
    );
  }

  return (
    <main
      className="shell theme-shell"
      data-aesthetic={club.aesthetic}
      data-circle={club.circleMode}
    >
      <VaultShell
        club={club}
        member={member}
        members={members}
        drops={drops}
        vip={vip}
        joinUrl={joinUrl}
      />
    </main>
  );
}
