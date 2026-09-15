import { access, copyFile } from "node:fs/promises";

const source = process.argv[2];
const destination = process.argv[3] ?? process.env.DATABASE_PATH ?? "./data/game.sqlite";
const force = process.argv.includes("--force");

if (!source) throw new Error("Usage: node scripts/restore-db.mjs <backup.sqlite> [destination.sqlite] [--force]");
if (!force) {
  try {
    await access(destination);
    throw new Error(`${destination} already exists; pass --force to overwrite it`);
  } catch (error) {
    if (error instanceof Error && !error.message.includes("ENOENT")) throw error;
  }
}

await copyFile(source, destination);
console.log(`Database restored to: ${destination}`);
