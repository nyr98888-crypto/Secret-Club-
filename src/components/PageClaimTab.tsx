"use client";

import { useEffect, useRef, useState } from "react";
import type { PageClaim } from "@/lib/scrapbookStore";
import type { LocalMember } from "@/lib/localClub";

type PageClaimTabProps = {
  side: "left" | "right";
  claim: PageClaim | null;
  members: LocalMember[];
  onClaim: (claim: PageClaim) => void;
};

const MASCOTS = ["🍓", "🐼", "🐱", "🐰", "🦄", "🐸", "🐥", "🐻"];

export function PageClaimTab({
  side,
  claim,
  members,
  onClaim,
}: PageClaimTabProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(claim?.title ?? "");
  const [mascot, setMascot] = useState(claim?.mascot ?? MASCOTS[0]);
  const [memberId, setMemberId] = useState(
    claim?.memberId ?? members[0]?.id ?? "",
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(claim?.title ?? "");
    setMascot(claim?.mascot ?? MASCOTS[0]);
    setMemberId(claim?.memberId ?? members[0]?.id ?? "");
  }, [claim, members]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = claim
    ? `${claim.mascot} ${claim.title || `${claim.memberName}'s Page`}`
    : side === "left"
      ? "🍓 Maya's Page"
      : "🐼 Tap to Claim";

  function save() {
    const member = members.find((m) => m.id === memberId) ?? members[0];
    const name = member?.codeName || "Friend";
    onClaim({
      memberId: member?.id,
      memberName: name,
      mascot,
      title: title.trim() || `${name}'s Page`,
    });
    setOpen(false);
  }

  const tabTone =
    side === "left"
      ? "bg-pink-400 hover:bg-pink-500"
      : "bg-purple-400 hover:bg-purple-500";

  return (
    <div
      ref={rootRef}
      className={`absolute z-30 ${
        side === "left" ? "left-10 top-[-18px]" : "right-10 top-[-18px]"
      }`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`flex cursor-pointer items-center gap-1.5 rounded-t-xl px-4 py-1.5 text-xs font-black text-white shadow-sm transition-transform hover:-translate-y-0.5 ${tabTone}`}
      >
        {label}
      </button>

      {open ? (
        <div
          className="absolute top-full left-0 z-50 mt-1 w-56 rounded-2xl border-2 border-pink-200 bg-white p-3 shadow-xl"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="mb-2 text-[0.65rem] font-black uppercase tracking-wide text-pink-500">
            Claim this page
          </p>
          {members.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMemberId(m.id)}
                  className={`rounded-full px-2 py-1 text-[0.65rem] font-bold ${
                    memberId === m.id
                      ? "bg-pink-500 text-white"
                      : "bg-pink-50 text-pink-700"
                  }`}
                >
                  {m.codeName}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mb-2 flex flex-wrap gap-1">
            {MASCOTS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMascot(m)}
                className={`grid h-8 w-8 place-items-center rounded-lg text-base ${
                  mascot === m ? "bg-pink-200 ring-2 ring-pink-400" : "bg-pink-50"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Maya's Corner"
            className="mb-2 w-full rounded-xl border border-pink-200 px-2 py-1.5 text-xs font-semibold"
            maxLength={28}
          />
          <button
            type="button"
            onClick={save}
            className="w-full rounded-xl bg-pink-500 py-2 text-xs font-black text-white"
          >
            Save Tab ✨
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default PageClaimTab;
