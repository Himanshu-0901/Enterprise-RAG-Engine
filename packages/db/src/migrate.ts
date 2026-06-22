import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations");
}

const migrationsDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  "../migrations"
);

const client = postgres(databaseUrl, { prepare: false });

try {
  await client`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const fileName of migrationFiles) {
    const [existingMigration] = await client`
      SELECT version FROM schema_migrations WHERE version = ${fileName}
    `;

    if (existingMigration) {
      continue;
    }

    const sql = await readFile(join(migrationsDirectory, fileName), "utf8");

    await client.begin(async (transaction) => {
      await transaction.unsafe(sql);
      await transaction`
        INSERT INTO schema_migrations (version) VALUES (${fileName})
      `;
    });

    process.stdout.write(`Applied migration ${fileName}\n`);
  }
} finally {
  await client.end();
}
