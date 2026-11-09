import { query } from "@/lib/db";
import { sentSms } from "@/lib/sms";

export async function reset() {
  await query(`TRUNCATE managers, buildings, apartments, residents, services, prices, payments,
                payment_months, expenses, login_codes, sessions CASCADE`);
  sentSms.length = 0;
}

let n = 0;
export const phone = () => `+3834400${String(++n).padStart(4, "0")}`;

/** Building with floors 0 and 1, cleaning 5/5 and elevator 0/10 (cents x100). */
export async function demoBuilding(start = "2026-01-01") {
  const [m] = await query<{ id: string }>(
    "INSERT INTO managers (first_name, last_name, phone) VALUES ('M', 'One', $1) RETURNING id", [phone()]);
  const [b] = await query<{ id: string }>(
    `INSERT INTO buildings (manager_id, name, country, currency, start_month) VALUES ($1, 'B', 'XK', 'EUR', $2) RETURNING id`,
    [m.id, start]);
  const [a0] = await query<{ id: string }>("INSERT INTO apartments (building_id, number, floor) VALUES ($1, '1', 0) RETURNING id", [b.id]);
  const [a1] = await query<{ id: string }>("INSERT INTO apartments (building_id, number, floor) VALUES ($1, '5', 1) RETURNING id", [b.id]);
  const [clean] = await query<{ id: string }>("INSERT INTO services (building_id, name) VALUES ($1, 'Pastrimi') RETURNING id", [b.id]);
  const [lift] = await query<{ id: string }>("INSERT INTO services (building_id, name) VALUES ($1, 'Ashensori') RETURNING id", [b.id]);
  for (const [svc, floor, cents] of [[clean.id, 0, 500], [clean.id, 1, 500], [lift.id, 0, 0], [lift.id, 1, 1000]] as const)
    await query("INSERT INTO prices (service_id, floor, amount_cents, valid_from) VALUES ($1, $2, $3, $4)", [svc, floor, cents, start]);
  const res = async (aptId: string) => (await query<{ id: string; phone: string }>(
    "INSERT INTO residents (apartment_id, first_name, last_name, phone) VALUES ($1, 'R', 'X', $2) RETURNING id, phone",
    [aptId, phone()]))[0];
  return { managerId: m.id, buildingId: b.id, apt0: a0.id, apt1: a1.id, cleanId: clean.id, liftId: lift.id,
    r0: await res(a0.id), r1: await res(a1.id) };
}

export function lastCode(to: string): string {
  const msg = [...sentSms].reverse().find((s) => s.to === to);
  return msg?.text.match(/\d{6}/)?.[0] ?? "";
}
