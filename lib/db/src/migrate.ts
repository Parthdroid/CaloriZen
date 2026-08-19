import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./index";

const migrationName = "0001_secure_email_auth";
const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const migrationPath = path.join(
  packageRoot,
  "migrations",
  `${migrationName}.sql`,
);

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(482019260819)");
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const existing = await client.query<{ name: string }>(
      "SELECT name FROM app_migrations WHERE name = $1",
      [migrationName],
    );

    if (existing.rowCount === 0) {
      const sql = await readFile(migrationPath, "utf8");
      await client.query(sql);
      await client.query("INSERT INTO app_migrations (name) VALUES ($1)", [
        migrationName,
      ]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error("Database migration failed", error);
  process.exitCode = 1;
});
