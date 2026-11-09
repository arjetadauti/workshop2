// Demo data: one manager (the platform-admin step) and one building in Kosovo.
import pg from "pg";
import { existsSync } from "node:fs";

if (!process.env.DATABASE_URL && existsSync(".env")) process.loadEnvFile(".env");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const phone = process.env.SEED_MANAGER_PHONE ?? "+38344000001";
const m = await client.query(
  `INSERT INTO managers (first_name, last_name, phone) VALUES ('Demo', 'Manager', $1)
   ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone RETURNING id`,
  [phone],
);
const existing = await client.query("SELECT 1 FROM buildings WHERE manager_id = $1", [m.rows[0].id]);
if (existing.rowCount === 0) {
  const start = new Date();
  start.setUTCMonth(start.getUTCMonth() - 5, 1);
  await client.query(
    `INSERT INTO buildings (manager_id, name, country, currency, start_month)
     VALUES ($1, 'Hyrja 3, Rruga e Demos', 'XK', 'EUR', $2)`,
    [m.rows[0].id, start.toISOString().slice(0, 10)],
  );
}
console.log(`manager phone: ${phone} (log in with this number; the code is printed by npm run dev)`);
await client.end();
