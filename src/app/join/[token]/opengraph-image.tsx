import { ImageResponse } from "next/og";
import { findClubBySlug } from "@/lib/store";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const club = await findClubBySlug(token);
  const name = club?.name || "Secret Club";
  const mode = club?.circleMode === "squad" ? "SquadVault" : "BestieVault";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(145deg, #1a1024 0%, #3b1848 50%, #0b2a3a 100%)",
          color: "#fff7fb",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 120,
            height: 120,
            borderRadius: 24,
            border: "4px solid #ffd166",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            marginBottom: 28,
            background: "#2a1838",
          }}
        >
          🔒
        </div>
        <div style={{ fontSize: 28, letterSpacing: 6, opacity: 0.8 }}>{mode}</div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 8 }}>{name}</div>
        <div style={{ fontSize: 30, marginTop: 24, maxWidth: 900, opacity: 0.92 }}>
          Classified drop locked inside. Need the 4-key passcode to enter.
        </div>
      </div>
    ),
    { ...size },
  );
}
