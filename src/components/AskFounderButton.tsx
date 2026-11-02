"use client";

import { useState } from "react";
import { askFounderMessage, nativeShare } from "@/lib/share";

export function AskFounderButton({
  clubName,
  vaultUrl,
}: {
  clubName: string;
  vaultUrl: string;
}) {
  const [toast, setToast] = useState("");

  return (
    <div className="ask-founder">
      <button
        type="button"
        className="btn-link"
        onClick={async () => {
          const text = askFounderMessage(clubName, vaultUrl);
          const result = await nativeShare({
            title: "Ask the founder",
            text,
            url: vaultUrl,
          });
          if (result === "copied") {
            setToast("Message copied");
            setTimeout(() => setToast(""), 2000);
          }
        }}
      >
        Forgot the code? Ask the founder
      </button>
      {toast ? <p className="toast">{toast}</p> : null}
    </div>
  );
}
