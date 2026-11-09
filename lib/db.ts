import { Pool, type PoolClient } from "pg";

const globalForPool = globalThis as unknown as { pgPool?: Pool };

export const pool: Pool =
  globalForPool.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalForPool.pgPool = pool;

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const res = await pool.query(sql, params);
  return res.rows as T[];
}

/** Runs fn inside one transaction; rolls back on any error. */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
