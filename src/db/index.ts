/**
 * Neon + Drizzle entrypoint for production Postgres.
 * Local/dev persistence uses `src/lib/store.ts` (`.data/store.json`)
 * so the MVP runs without DATABASE_URL. When DATABASE_URL is set,
 * run `npm run db:push` to provision the schema for a future cutover.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const sql = neon(url);
  return drizzle(sql, { schema });
}
