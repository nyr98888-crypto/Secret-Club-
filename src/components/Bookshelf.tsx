"use client";

import { useState } from "react";
import type { StoredScrapbook } from "@/lib/scrapbookStore";
import {
  deleteScrapbook,
  renameScrapbook,
  setActiveScrapbookId,
} from "@/lib/scrapbookStore";

type BookshelfProps = {
  scrapbooks: StoredScrapbook[];
  activeId?: string | null;
  onOpen: (id: string) => void;
  onRefresh: () => void;
  onCreateNew?: () => void;
  /** Called after a delete so the vault can sync the open book */
  onDeleted?: (nextActiveId: string | null) => void;
};

export function Bookshelf({
  scrapbooks,
  activeId,
  onOpen,
  onRefresh,
  onCreateNew,
  onDeleted,
}: BookshelfProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const canDelete = scrapbooks.length > 1;

  function requestDelete(book: StoredScrapbook) {
    if (!canDelete) return;
    const ok = window.confirm(
      "Delete this scrapbook? All decorated pages will be removed.",
    );
    if (!ok) return;
    const result = deleteScrapbook(book.id);
    if (!result.removed) return;
    onRefresh();
    onDeleted?.(result.activeId);
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-2">
      <div className="mb-4 text-center">
        <p className="eyebrow m-0">Your Bookshelf</p>
        <h2 className="m-0 text-3xl font-black text-[var(--ink)]">
          Scrapbook Covers
        </h2>
        <p className="fine-print m-0 mt-1">
          Tap a cover to open · rename or delete from the title plate
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {scrapbooks.map((book) => {
          const active = book.id === activeId;
          return (
            <div key={book.id} className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveScrapbookId(book.id);
                  onOpen(book.id);
                }}
                className={`relative aspect-[3/4] w-full max-w-[11rem] overflow-hidden rounded-2xl border-4
                  bg-gradient-to-br from-pink-200 via-rose-100 to-violet-200 shadow-lg transition
                  hover:-translate-y-1 hover:shadow-xl active:translate-y-0
                  ${active ? "border-pink-500 ring-4 ring-pink-300/50" : "border-white"}`}
                aria-label={`Open ${book.name}`}
              >
                <span className="absolute inset-0 grid place-items-center text-5xl">
                  {book.themeIcon || "📒"}
                </span>
                <span className="absolute inset-x-2 bottom-2 rounded-xl bg-white/90 px-2 py-1.5 text-center text-[0.7rem] font-black text-pink-700 shadow">
                  {book.name}
                </span>
              </button>

              {editingId === book.id ? (
                <form
                  className="flex w-full max-w-[11rem] gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    renameScrapbook(book.id, draft);
                    setEditingId(null);
                    onRefresh();
                  }}
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-pink-200 px-2 py-1 text-xs font-bold"
                    autoFocus
                    maxLength={48}
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-pink-500 px-2 text-xs font-black text-white"
                  >
                    ✓
                  </button>
                </form>
              ) : (
                <div className="flex w-full max-w-[11rem] flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(book.id);
                      setDraft(book.name);
                    }}
                    className="inline-flex items-center gap-0.5 text-[0.65rem] font-bold text-pink-500 underline-offset-2 hover:underline"
                  >
                    <span aria-hidden>✏️</span> Rename
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => requestDelete(book)}
                      className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-rose-600 underline-offset-2 hover:bg-rose-500/20"
                      aria-label={`Delete ${book.name}`}
                    >
                      <span aria-hidden>🗑️</span> Delete
                    </button>
                  ) : (
                    <span
                      className="text-[0.6rem] font-bold text-slate-400"
                      title="Keep at least one scrapbook"
                    >
                      Last book
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {onCreateNew ? (
          <button
            type="button"
            onClick={onCreateNew}
            className="flex aspect-[3/4] w-full max-w-[11rem] flex-col items-center justify-center gap-2
              justify-self-center rounded-2xl border-4 border-dashed border-pink-300 bg-pink-50/80
              text-pink-500 transition hover:bg-pink-100"
          >
            <span className="text-3xl">✨</span>
            <span className="text-xs font-black">New Scrapbook</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default Bookshelf;
