import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import Database from "better-sqlite3";

const source = process.argv[2] ?? process.env.DATABASE_PATH ?? "./data/game.sqlite";
const destination = process.argv[3] ?? `./data/backups/game-${new Date().toISOString().replaceAll(":", "-")}.sqlite`;

await mkdir(dirname(destination), { recursive: true });
const database = new Database(source, { readonly: true });
await database.backup(destination);
database.close();
console.log(`Database backup created: ${destination}`);
