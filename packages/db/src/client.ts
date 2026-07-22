/**
 * PGlite — real Postgres compiled to WASM, running in-process.
 *
 * This database is a *build-time* source of truth. It is queried by
 * `generateStaticParams` and by page components during `next build`, and the
 * deployed artifact contains no database and opens no connection.
 *
 * It is rehydrated **in memory** on first use: migrations are applied and
 * `seed/bls-data.json` is imported. Nothing is read from or written to disk.
 * That matters because `next build` collects page data across several worker
 * processes at once, and PGlite — like Postgres — is single-writer over a data
 * directory; seven processes opening the same one aborts the WASM runtime.
 * An in-memory copy per process has no lock to contend for.
 *
 * It also means the committed JSON *is* the database. There is no build
 * artifact to keep in sync, a clone can build the site with no BLS key and no
 * network, and every environment starts from byte-identical data.
 *
 * If this ever needs to become a hosted Postgres, it is a driver swap —
 * `drizzle-orm/pglite` → `drizzle-orm/node-postgres`. The schema, the
 * migrations and every query port unchanged.
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as schema from "./schema";

/**
 * Built with `join`, never `new URL(x, import.meta.url)`: bundlers treat that
 * exact pattern as a static asset reference and try to resolve it as a module,
 * which fails the Next build. These are plain directories read at build time.
 */
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS = join(packageRoot, "drizzle");

let client: PGlite | undefined;
let ready: Promise<Database> | undefined;

function connect(pglite: PGlite) {
  return drizzle({ client: pglite, schema, casing: "snake_case" });
}

/**
 * Process-wide handle, memoised on the promise so concurrent callers share one
 * rehydration rather than racing three of them.
 */
export function getDb(): Promise<Database> {
  ready ??= (async () => {
    client = new PGlite();
    const db = connect(client);
    await migrate(db, { migrationsFolder: MIGRATIONS });
    // Imported lazily: seed.ts reads the schema and would otherwise close a
    // cycle back through this module.
    const { importSeed } = await import("./seed");
    await importSeed(db, { quiet: true });
    return db;
  })();
  return ready;
}

/**
 * PGlite keeps the event loop alive, so a script that finishes its work will
 * still hang forever unless the handle is closed. Any CLI entry point in this
 * package must call this.
 */
export async function closeDb() {
  await client?.close();
  client = undefined;
  ready = undefined;
}

/** An isolated, empty in-memory database. Used by tests. */
export function createMemoryDb() {
  return connect(new PGlite());
}

/** An isolated in-memory database with the schema applied but no data. */
export async function createMigratedDb() {
  const db = createMemoryDb();
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db;
}

export type Database = ReturnType<typeof connect>;
export { schema };
