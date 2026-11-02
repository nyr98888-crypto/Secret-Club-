"use client";

import { useEffect, useState } from "react";
import { SlotMachineRoller } from "./SlotMachineRoller";

type NewScrapbookModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, themeIcon: string) => void;
  onRequestVip?: () => void;
};

/**
 * Slot-machine name + mascot creator for a brand-new scrapbook cover.
 */
export function NewScrapbookModal({
  open,
  onClose,
  onCreate,
  onRequestVip,
}: NewScrapbookModalProps) {
  const [name, setName] = useState("Strawberry Shortcakes");
  const [icon, setIcon] = useState("🍓");
  const [spun, setSpun] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSpun(false);
    setName("Strawberry Shortcakes");
    setIcon("🍓");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-scrapbook-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[2rem] border-4 border-pink-200 bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <p className="m-0 text-xs font-black uppercase tracking-wider text-pink-500">
            New Scrapbook Cover
          </p>
          <h2
            id="new-scrapbook-title"
            className="m-0 mt-1 text-2xl font-black text-slate-800"
          >
            Spin a Magic Name!
          </h2>
          <p className="m-0 mt-1 text-xs font-semibold text-slate-500">
            Roll a cute squad title + mascot for your cover plate
          </p>
        </div>

        <SlotMachineRoller
          onNameSelected={(n, i) => {
            setName(n);
            setIcon(i);
            setSpun(true);
          }}
          onOpenVipModal={onRequestVip}
        />

        <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border-2 border-pink-100 bg-pink-50/80 px-3 py-2">
          <span className="text-2xl" aria-hidden>
            {icon}
          </span>
          <span className="text-sm font-black text-pink-700">{name}</span>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border-2 border-pink-100 bg-white py-3 text-sm font-black text-pink-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onCreate(name, icon);
              setSpun(false);
            }}
            className="flex-[1.4] rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 py-3 text-sm font-black text-white shadow-md disabled:opacity-50"
            disabled={!spun && name === "Strawberry Shortcakes"}
            title={spun ? "Create this cover" : "Spin once, then create"}
          >
            Create Book ✨
          </button>
        </div>
        {!spun ? (
          <p className="mt-2 text-center text-[0.65rem] font-bold text-pink-400">
            Give the slot machine a spin first!
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default NewScrapbookModal;
