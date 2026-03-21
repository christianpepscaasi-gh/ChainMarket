import { createDatabase } from "./db.js";

const database = await createDatabase();
await database.resetDemoData();
await database.db.close();

console.log("SQLite demo data cleared.");
