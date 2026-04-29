import { createPool } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema.ts";

let db: any = null;
let databaseInfo = {
  connected: false,
  host: null as string | null,
  database: null as string | null,
  port: null as number | null,
};

function createMySqlPool(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get("ssl-mode") || url.searchParams.get("sslmode");
  const requiresSsl = sslMode?.toLowerCase() === "required";

  return createPool({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

export const connectionPromise = (async () => {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set - database features unavailable");
    return;
  }

  try {
    console.log("Attempting to connect to MySQL...");
    const url = new URL(process.env.DATABASE_URL);
    const pool = createMySqlPool(process.env.DATABASE_URL);
    await pool.query("SELECT 1");
    db = drizzle({ client: pool, schema, mode: "default" });
    databaseInfo = {
      connected: true,
      host: url.hostname,
      database: url.pathname.replace(/^\//, ""),
      port: Number(url.port || 3306),
    };
    console.log("MySQL database connected successfully!");
  } catch (err) {
    console.error("Failed to connect to MySQL database:", err);
  }
})();

export function getDatabaseInfo() {
  return databaseInfo;
}

export { db };
