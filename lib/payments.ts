// Cash payments and month status (SPEC 6.1, 6.3, 6.4).
import type { PoolClient } from "pg";
import { query, tx } from "./db";
import { addMonths, toMonth } from "./months";

export class PaymentError extends Error {
  constructor(public code: "not_found" | "receipt_used" | "invalid" | "price_missing") { super(code); }
}

/** What one apartment owes for one month: the latest price of every service for its floor. */
async function monthlyDue(c: PoolClient, buildingId: string, floor: number, month: string): Promise<number> {
  const { rows } = await c.query<{ name: string; amount_cents: string | null }>(
    `SELECT s.name,
            (SELECT p.amount_cents FROM prices p
             WHERE p.service_id = s.id AND p.floor = $2 AND p.valid_from <= $3
             ORDER BY p.valid_from DESC LIMIT 1) AS amount_cents
     FROM services s WHERE s.building_id = $1`, [buildingId, floor, month]);
  if (rows.length === 0 || rows.some((r) => r.amount_cents === null)) throw new PaymentError("price_missing");
  return rows.reduce((sum, r) => sum + Number(r.amount_cents), 0);
}

export type CashResult = { months: string[]; amountCents: number; currency: string; apartmentNumber: string };

/**
 * Records a cash payment for the oldest unpaid months of an apartment, in one transaction.
 * Only works for an apartment in a building this manager manages.
 */
export async function recordCashPayment(input: {
  managerId: string; apartmentId: string; monthCount: number; receiptNo: string;
}): Promise<CashResult> {
  const receipt = input.receiptNo.trim();
  if (![1, 3, 12].includes(input.monthCount) || !/^[\w\-/]{1,30}$/.test(receipt)) throw new PaymentError("invalid");
  return tx(async (c) => {
    // Lock the apartment row so two payments for it can't run at the same time.
    const { rows: [apt] } = await c.query<{
      id: string; number: string; floor: number; building_id: string; start_month: string; currency: string;
    }>(
      `SELECT a.id, a.number, a.floor, a.building_id, to_char(b.start_month, 'YYYY-MM-DD') AS start_month, b.currency
       FROM apartments a JOIN buildings b ON b.id = a.building_id
       WHERE a.id = $1 AND b.manager_id = $2 FOR UPDATE OF a`, [input.apartmentId, input.managerId]);
    if (!apt) throw new PaymentError("not_found");

    const { rows: paid } = await c.query<{ month: string }>(
      "SELECT to_char(month, 'YYYY-MM-DD') AS month FROM payment_months WHERE apartment_id = $1", [apt.id]);
    const paidSet = new Set(paid.map((p) => p.month));
    const months: string[] = [];
    for (let m = apt.start_month; months.length < input.monthCount; m = addMonths(m, 1))
      if (!paidSet.has(m)) months.push(m); // oldest unpaid first

    const dues = [];
    for (const m of months) dues.push(await monthlyDue(c, apt.building_id, apt.floor, m));
    const total = dues.reduce((a, b) => a + b, 0);

    let paymentId: string;
    try {
      const { rows: [p] } = await c.query<{ id: string }>(
        `INSERT INTO payments (apartment_id, building_id, method, amount_cents, receipt_no, recorded_by)
         VALUES ($1, $2, 'cash', $3, $4, $5) RETURNING id`,
        [apt.id, apt.building_id, total, receipt, input.managerId]);
      paymentId = p.id;
    } catch (e) {
      if ((e as { code?: string }).code === "23505") throw new PaymentError("receipt_used");
      throw e;
    }
    for (let i = 0; i < months.length; i++)
      await c.query("INSERT INTO payment_months (payment_id, apartment_id, month, amount_cents) VALUES ($1, $2, $3, $4)",
        [paymentId, apt.id, months[i], dues[i]]);
    return { months, amountCents: total, currency: apt.currency, apartmentNumber: apt.number };
  });
}

export type MonthStatus = { month: string; paid: boolean; receiptNo: string | null; amountCents: number | null; overdue: boolean };

/** Month-by-month status for ONE apartment, from the building's start month to now (or later if prepaid). */
export async function apartmentMonths(apartmentId: string, today = new Date()): Promise<MonthStatus[]> {
  const [b] = await query<{ start_month: string; due_day: number }>(
    `SELECT to_char(b.start_month, 'YYYY-MM-DD') AS start_month, b.due_day
     FROM apartments a JOIN buildings b ON b.id = a.building_id WHERE a.id = $1`, [apartmentId]);
  if (!b) return [];
  const paid = await query<{ month: string; receipt_no: string | null; amount_cents: string }>(
    `SELECT to_char(pm.month, 'YYYY-MM-DD') AS month, p.receipt_no, pm.amount_cents
     FROM payment_months pm JOIN payments p ON p.id = pm.payment_id
     WHERE pm.apartment_id = $1`, [apartmentId]);
  const byMonth = new Map(paid.map((p) => [p.month, p]));
  const now = toMonth(today);
  const last = [now, ...paid.map((p) => p.month)].sort().at(-1)!;
  const out: MonthStatus[] = [];
  for (let m = b.start_month; m <= last; m = addMonths(m, 1)) {
    const p = byMonth.get(m);
    const due = new Date(`${m.slice(0, 8)}${String(b.due_day).padStart(2, "0")}T23:59:59Z`);
    out.push({ month: m, paid: !!p, receiptNo: p?.receipt_no ?? null, amountCents: p ? Number(p.amount_cents) : null,
      overdue: !p && today > due });
  }
  return out;
}
