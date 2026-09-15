import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { initialMigration } from "./migrations.js";
import { sqliteSchema } from "./schema.js";

export function createSqliteDatabase(filename: string) {
  if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true });
  const raw = new Database(filename);
  raw.pragma("journal_mode = WAL");
  raw.pragma("foreign_keys = ON");
  raw.exec(initialMigration);
  ensureColumn(raw, "email_deliveries", "subject", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(raw, "email_deliveries", "html", "TEXT NOT NULL DEFAULT ''");

  return {
    raw,
    db: drizzle(raw, { schema: sqliteSchema }),
  };
}

function ensureColumn(database: Database.Database, table: string, column: string, definition: string): void {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export type SqliteDatabase = ReturnType<typeof createSqliteDatabase>;
