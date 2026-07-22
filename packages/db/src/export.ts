/**
 * Dump the database back to `seed/bls-data.json`.
 *
 * Run after `pnpm ingest` has pulled fresh BLS data. The diff on that file is
 * the review surface for a data refresh.
 */
import { closeDb, getDb } from "./client";
import { exportSeed } from "./seed";

try {
  await exportSeed(await getDb());
} finally {
  await closeDb();
}
