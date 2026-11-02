"use client";

import { useState } from "react";
import { nativeShare, type SharePayload } from "@/lib/share";

export function ShareButton({
  payload,
  label = "Send Secret Invite",
  className = "btn-primary",
}: {
  payload: SharePayload;
  label?: string;
  className?: string;
}) {
  const [toast, setToast] = useState("");

  return (
    <div className="share-wrap">
      <button
        type="button"
        className={className}
        onClick={async () => {
          const result = await nativeShare(payload);
          if (result === "copied") {
            setToast("Link copied — drop it in your chat");
            setTimeout(() => setToast(""), 2500);
          }
        }}
      >
        {label}
      </button>
      {toast ? <p className="toast">{toast}</p> : null}
    </div>
  );
}
