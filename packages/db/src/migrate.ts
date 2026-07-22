import { migrate } from "drizzle-orm/pglite/migrator";
import { fileURLToPath } from "node:url";

import { closeDb, getDb } from "./client";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

try {
  await migrate(getDb(), { migrationsFolder });
  console.log("migrations applied");
} finally {
  await closeDb();
}
