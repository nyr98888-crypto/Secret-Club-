import type { Metadata } from "next";
import { findClubBySlug } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const club = await findClubBySlug(token);
  const title = club
    ? `${club.name} — Secret Club`
    : "Secret Club Vault";
  const description =
    "Classified drop locked inside. Need the 4-key passcode to enter.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
