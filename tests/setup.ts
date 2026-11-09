// Tests run against TEST_DATABASE_URL, never the dev database. SMS go to memory.
import { existsSync } from "node:fs";
import { beforeAll } from "vitest";

if (existsSync(".env")) process.loadEnvFile(".env");
if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is not set");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.SMS_PROVIDER = "memory";

beforeAll(async () => {
  const { migrate } = await import("../scripts/migrate");
  await migrate(process.env.DATABASE_URL);
});
