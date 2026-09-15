import { describe, expect, it } from "vitest";
import { initialMigration } from "./migrations.js";
import { createSqliteDatabase } from "./sqlite.js";

describe("SQLite adapter", () => {
  it("applies the initial migration repeatedly", () => {
    const database = createSqliteDatabase(":memory:");

    expect(() => database.raw.exec(initialMigration)).not.toThrow();

    const tables = database.raw
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as Array<{ name: string }>;

    expect(tables.map((table) => table.name)).toEqual([
      "campaign_versions",
      "email_deliveries",
      "energy_events",
      "games",
      "leaderboard_source_scores",
      "members",
      "referral_attributions",
      "referral_links",
      "referrals",
      "sessions",
    ]);

    database.raw.close();
  });
});
