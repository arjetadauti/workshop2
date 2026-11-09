import { notFound } from "next/navigation";
import { query } from "./db";

export type Building = {
  id: string; name: string; country: string; currency: string; due_day: number; start_month: string;
};

const COLS = "id, name, country, currency, due_day, to_char(start_month, 'YYYY-MM-DD') AS start_month";

/** Returns the building only if this manager manages it; otherwise 404. */
export async function managedBuilding(managerId: string, buildingId: string): Promise<Building> {
  if (!/^[0-9a-f-]{36}$/i.test(buildingId)) notFound();
  const [b] = await query<Building>(`SELECT ${COLS} FROM buildings WHERE id = $1 AND manager_id = $2`, [buildingId, managerId]);
  if (!b) notFound();
  return b;
}

export async function buildingById(id: string): Promise<Building | null> {
  const [b] = await query<Building>(`SELECT ${COLS} FROM buildings WHERE id = $1`, [id]);
  return b ?? null;
}
