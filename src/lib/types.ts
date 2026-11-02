export type Aesthetic =
  | "retro_y2k"
  | "kawaii_pastel"
  | "goth_cottagecore"
  | "cyber_pixel";

export type CircleMode = "bestie" | "squad";

export type Club = {
  id: string;
  slug: string;
  name: string;
  aesthetic: Aesthetic;
  circleMode: CircleMode;
  passcodeHash: string;
  prefixHashes: string[];
  sealSeed: string;
  ownerBrowserId: string;
  createdAt: string;
};

export type Member = {
  id: string;
  clubId: string;
  codeName: string;
  photoBlobUrl: string | null;
  isFounder: boolean;
  joinedAt: string;
};

export type Drop = {
  id: string;
  clubId: string;
  authorMemberId: string;
  kind: "locked_note";
  bodyText: string;
  imageBlobUrl: string | null;
  createdAt: string;
};

export type DeviceSession = {
  token: string;
  memberId: string;
  clubId: string;
  createdAt: string;
};

export type BrowserEntitlement = {
  browserId: string;
  vipLifetime: boolean;
  stripeCustomerId: string | null;
  stripeCheckoutSessionId: string | null;
  purchasedAt: string | null;
  pdfExportCount: number;
  /** HMAC lifetime VIP license (scvip_…) */
  licenseKey?: string | null;
};

export type PublicClub = Pick<
  Club,
  "id" | "slug" | "name" | "aesthetic" | "circleMode" | "sealSeed" | "createdAt"
>;
