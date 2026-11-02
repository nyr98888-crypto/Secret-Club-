"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import type { Aesthetic, CircleMode } from "@/lib/types";
import { captureCanvasPng } from "@/lib/exportPage";
import { VipUpsell } from "./VipUpsell";

export function ClubIdCard({
  clubName,
  codeName,
  aesthetic,
  circleMode,
  joinDate,
  photoUrl,
  sealSeed,
}: {
  clubName: string;
  codeName: string;
  aesthetic: Aesthetic;
  circleMode: CircleMode;
  joinDate: string;
  photoUrl: string | null;
  sealSeed: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [vipGate, setVipGate] = useState(false);
  const [message, setMessage] = useState("");

  const root =
    circleMode === "squad"
      ? "https://squadvault.app"
      : "https://bestievault.app";

  useEffect(() => {
    QRCode.toDataURL(root, {
      margin: 1,
      width: 180,
      color: { dark: "#111111", light: "#ffffff" },
    }).then(setQr);
  }, [root]);

  async function downloadPdf() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/export", { method: "POST" });
      const data = await res.json();
      if (res.status === 402) {
        setVipGate(true);
        return;
      }
      if (!res.ok || !sheetRef.current) {
        setMessage("Could not export");
        return;
      }

      const canvas = await captureCanvasPng(sheetRef.current);
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [190, 80],
      });
      pdf.addImage(img, "PNG", 5, 5, 180, 70);
      pdf.save(`${clubName.replace(/\s+/g, "-")}-club-id.pdf`);
      setMessage(
        data.watermark
          ? "Exported (free watermarked). VIP unlocks unlimited hi-res."
          : "High-res watermark-free PDF downloaded.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="club-id-panel">
      <div
        className="print-sheet"
        ref={sheetRef}
        data-aesthetic={aesthetic}
        data-circle={circleMode}
      >
        <div className="cut-guides" aria-hidden>
          <span className="scissors tl">✂ - - - -</span>
          <span className="scissors tr">- - - - ✂</span>
          <span className="scissors bl">✂ - - - -</span>
          <span className="scissors br">- - - - ✂</span>
        </div>

        <div className="badge-card card-front">
          <div className="lanyard-hole" aria-hidden />
          <p className="card-eyebrow">
            {circleMode === "squad" ? "Official Squad ID" : "Official Bestie Club ID"}
          </p>
          <h3>{clubName}</h3>
          <div className="card-photo-row">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="card-photo" />
            ) : (
              <div className="card-photo placeholder">☺</div>
            )}
            <div>
              <p className="code-name">{codeName}</p>
              <p className="meta">
                Joined {new Date(joinDate).toLocaleDateString()}
              </p>
              <p className="meta">Seal #{sealSeed}</p>
            </div>
          </div>
        </div>

        <div className="fold-line" aria-hidden>
          <span>FOLD</span>
        </div>

        <div className="badge-card card-back">
          <div className="lanyard-hole" aria-hidden />
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR to start a vault" className="card-qr" />
          ) : null}
          <p className="qr-cta">Scan to start your own Secret Vault</p>
        </div>
      </div>
      <p className="helper">
        Cut on the dashes, fold on the center line, wrap in clear tape.
      </p>
      <button
        type="button"
        className="btn-primary"
        disabled={busy}
        onClick={downloadPdf}
      >
        {busy ? "Preparing PDF…" : "Download PDF"}
      </button>
      {vipGate ? (
        <VipUpsell reason="✨ Unlock the Magic Chest" />
      ) : null}
      {message ? <p className="toast">{message}</p> : null}
    </div>
  );
}
