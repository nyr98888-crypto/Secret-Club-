"use client";

import { useState } from "react";
import type { Aesthetic, CircleMode, Drop, Member, PublicClub } from "@/lib/types";
import { inviteMessage } from "@/lib/share";
import { ensureAudio, playPop } from "@/lib/audio";
import { ShareButton } from "./ShareButton";
import { LockedNoteComposer } from "./LockedNoteComposer";
import { ClubIdCard } from "./ClubIdCard";
import { VipUpsell } from "./VipUpsell";

export function VaultShell({
  club,
  member,
  members,
  drops: initialDrops,
  vip,
  joinUrl,
}: {
  club: PublicClub;
  member: Member;
  members: Member[];
  drops: Drop[];
  vip: boolean;
  joinUrl: string;
}) {
  const [tab, setTab] = useState<"drops" | "new" | "card">("drops");
  const [drops, setDrops] = useState(initialDrops);
  const [openId, setOpenId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch(`/api/clubs/${club.slug}`);
    const data = await res.json();
    if (data.drops) setDrops(data.drops);
    setTab("drops");
  }

  function switchTab(next: "drops" | "new" | "card") {
    void ensureAudio();
    playPop();
    setTab(next);
  }

  return (
    <div
      className="vault-shell theme-shell"
      data-aesthetic={club.aesthetic as Aesthetic}
      data-circle={club.circleMode as CircleMode}
    >
      <header className="vault-header">
        <div>
          <p className="eyebrow">
            {club.circleMode === "squad" ? "SquadVault" : "BestieVault"}
          </p>
          <h1>{club.name}</h1>
          <p className="lede">
            Signed in as <strong>{member.codeName}</strong>
            {vip ? " · VIP Key" : ""}
          </p>
        </div>
        <div className="header-actions">
          <ShareButton
            label="Send Secret Invite"
            payload={{
              title: club.name,
              text: inviteMessage(club.name, joinUrl),
              url: joinUrl,
            }}
          />
        </div>
      </header>

      <nav className="vault-tabs">
        <button
          type="button"
          className={tab === "drops" ? "active" : ""}
          onClick={() => switchTab("drops")}
        >
          Vault
        </button>
        <button
          type="button"
          className={tab === "new" ? "active" : ""}
          onClick={() => switchTab("new")}
        >
          New Drop
        </button>
        <button
          type="button"
          className={tab === "card" ? "active" : ""}
          onClick={() => switchTab("card")}
        >
          Club ID
        </button>
      </nav>

      {tab === "drops" && (
        <section className="drop-list">
          {drops.length === 0 ? (
            <p className="empty">No capsules yet — lock your first secret drop.</p>
          ) : (
            drops.map((d) => {
              const author =
                members.find((m) => m.id === d.authorMemberId)?.codeName ||
                "Member";
              const expanded = openId === d.id;
              return (
                <article
                  key={d.id}
                  className={`locked-capsule ${expanded ? "open" : ""}`}
                >
                  <button
                    type="button"
                    className="capsule-face"
                    onClick={() => {
                      void ensureAudio();
                      playPop();
                      setOpenId(expanded ? null : d.id);
                    }}
                  >
                    <span className="capsule-lock" aria-hidden>
                      🔒
                    </span>
                    <span className="capsule-copy">
                      <strong className="capsule-title">LOCKED CAPSULE</strong>
                      <span className="meta">
                        From {author} ·{" "}
                        {new Date(d.createdAt).toLocaleString()}
                      </span>
                    </span>
                    <span className="capsule-glow" aria-hidden />
                  </button>
                  {expanded ? (
                    <div className="capsule-body">
                      <p>{d.bodyText}</p>
                      {d.imageBlobUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={d.imageBlobUrl}
                          alt=""
                          className="drop-image"
                        />
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
          {!vip ? <VipUpsell reason="✨ Unlock the Magic Chest" /> : null}
        </section>
      )}

      {tab === "new" && (
        <LockedNoteComposer slug={club.slug} onCreated={refresh} />
      )}

      {tab === "card" && (
        <ClubIdCard
          clubName={club.name}
          codeName={member.codeName}
          aesthetic={club.aesthetic as Aesthetic}
          circleMode={club.circleMode as CircleMode}
          joinDate={member.joinedAt}
          photoUrl={member.photoBlobUrl}
          sealSeed={club.sealSeed}
        />
      )}
    </div>
  );
}
