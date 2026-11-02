import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const clubs = pgTable("clubs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  aesthetic: text("aesthetic").notNull(),
  circleMode: text("circle_mode").notNull(),
  passcodeHash: text("passcode_hash").notNull(),
  prefixHashes: jsonb("prefix_hashes").$type<string[]>().notNull(),
  sealSeed: text("seal_seed").notNull(),
  ownerBrowserId: text("owner_browser_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const members = pgTable("members", {
  id: text("id").primaryKey(),
  clubId: text("club_id").notNull(),
  codeName: text("code_name").notNull(),
  photoBlobUrl: text("photo_blob_url"),
  isFounder: boolean("is_founder").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const drops = pgTable("drops", {
  id: text("id").primaryKey(),
  clubId: text("club_id").notNull(),
  authorMemberId: text("author_member_id").notNull(),
  kind: text("kind").notNull().default("locked_note"),
  bodyText: text("body_text").notNull(),
  imageBlobUrl: text("image_blob_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deviceSessions = pgTable("device_sessions", {
  token: text("token").primaryKey(),
  memberId: text("member_id").notNull(),
  clubId: text("club_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const browserEntitlements = pgTable("browser_entitlements", {
  browserId: text("browser_id").primaryKey(),
  vipLifetime: boolean("vip_lifetime").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  purchasedAt: timestamp("purchased_at"),
  pdfExportCount: integer("pdf_export_count").default(0).notNull(),
  licenseKey: text("license_key"),
});
