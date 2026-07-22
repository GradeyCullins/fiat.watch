/**
 * PGlite — real Postgres compiled to WASM, running in-process.
 *
 * This database is a *build-time* source of truth. It is queried by
 * `generateStaticParams` and by page components during `next build`, and the
 * deployed artifact contains no database and opens no connection. That is why
 * an in-process engine is the right call rather than a server: there is no
 * daemon to run locally, no service container in CI, and no connection string
 * to leak. The persisted data directory doubles as the reproducible seed.
 *
 * If this ever needs to become a hosted Postgres, it is a driver swap —
 * `drizzle-orm/pglite` → `drizzle-orm/node-postgres`. The schema, the
 * migrations and every query port unchanged.
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as schema from "./schema";

/**
 * Note this deliberately avoids `new URL("../.pglite", import.meta.url)`.
 * Bundlers treat that exact pattern as a static asset reference and try to
 * resolve it as a module, which fails the Next build — the directory is
 * runtime state, not something to bundle.
 */
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Overridable so tests and CI can point at a scratch directory. */
export const DATA_DIR = process.env.PGLITE_DATA_DIR ?? join(packageRoot, ".pglite");

let instance: ReturnType<typeof create> | undefined;
let client: PGlite | undefined;

function create(dataDir: string = DATA_DIR) {
  client = new PGlite(dataDir);
  return drizzle({ client, schema, casing: "snake_case" });
}

/** Process-wide handle. PGlite is single-connection by design. */
export function getDb() {
  instance ??= create();
  return instance;
}

/**
 * PGlite keeps the event loop alive, so a script that finishes its work will
 * still hang forever unless the handle is closed. Any CLI entry point in this
 * package must call this.
 */
export async function closeDb() {
  await client?.close();
  client = undefined;
  instance = undefined;
}

/** An isolated in-memory database. Used by tests so they never touch the seed. */
export function createMemoryDb() {
  const client = new PGlite();
  return drizzle({ client, schema, casing: "snake_case" });
}

export type Database = ReturnType<typeof create>;
export { schema };
