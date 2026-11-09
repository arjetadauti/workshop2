// Expenses, invoices and the building balance (SPEC 7.1, 7.3).
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { query } from "./db";
import type { User } from "./auth-core";
import { toMonth } from "./months";

export const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR ?? "uploads");
const TYPES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const MAX_INVOICE_BYTES = 10 * 1024 * 1024;

export class ExpenseError extends Error {
  constructor(public code: "invalid" | "no_invoice" | "bad_invoice" | "not_found") { super(code); }
}

/** A manager sees the buildings they manage; a resident sees only their own building. */
export async function canSeeBuilding(user: User | null, buildingId: string): Promise<boolean> {
  if (!user || !/^[0-9a-f-]{36}$/i.test(buildingId)) return false;
  if (user.kind === "resident") return user.buildingId === buildingId;
  const rows = await query("SELECT 1 FROM buildings WHERE id = $1 AND manager_id = $2", [buildingId, user.id]);
  return rows.length > 0;
}

export async function recordExpense(input: {
  managerId: string; buildingId: string; serviceId: string; description: string;
  amountCents: number | null; paidOn: string; invoice: { name: string; type: string; bytes: Buffer } | null;
}): Promise<string> {
  const desc = input.description.trim();
  if (!desc || !input.amountCents || input.amountCents <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(input.paidOn)) throw new ExpenseError("invalid");
  if (!input.invoice || input.invoice.bytes.length === 0) throw new ExpenseError("no_invoice");
  const ext = TYPES[input.invoice.type];
  if (!ext || input.invoice.bytes.length > MAX_INVOICE_BYTES) throw new ExpenseError("bad_invoice");
  const [ok] = await query(
    "SELECT 1 FROM services s JOIN buildings b ON b.id = s.building_id WHERE s.id = $1 AND b.id = $2 AND b.manager_id = $3",
    [input.serviceId, input.buildingId, input.managerId]);
  if (!ok) throw new ExpenseError("not_found");

  const rel = join(input.buildingId, `${randomUUID()}.${ext}`); // never use the uploaded file name as a path
  await mkdir(join(UPLOAD_DIR, input.buildingId), { recursive: true });
  await writeFile(join(UPLOAD_DIR, rel), input.invoice.bytes);
  const [row] = await query<{ id: string }>(
    `INSERT INTO expenses (building_id, service_id, description, amount_cents, paid_on, invoice_path, invoice_name, recorded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [input.buildingId, input.serviceId, desc, input.amountCents, input.paidOn, rel, input.invoice.name.slice(0, 200), input.managerId]);
  return row.id;
}

export type Summary = {
  incomeCents: number; expenseCents: number; balanceCents: number;
  paidThisMonth: number; apartments: number;
  expenses: { id: string; description: string; service: string; amount_cents: string; paid_on: string; invoice_name: string }[];
};

/** Building-wide totals only: no names or apartment numbers (SPEC 7.3). */
export async function buildingSummary(buildingId: string, today = new Date()): Promise<Summary> {
  const [inc] = await query<{ s: string }>("SELECT coalesce(sum(amount_cents), 0) AS s FROM payments WHERE building_id = $1", [buildingId]);
  const [exp] = await query<{ s: string }>("SELECT coalesce(sum(amount_cents), 0) AS s FROM expenses WHERE building_id = $1", [buildingId]);
  const [col] = await query<{ paid: number; total: number }>(
    `SELECT (SELECT count(DISTINCT pm.apartment_id)::int FROM payment_months pm JOIN apartments a ON a.id = pm.apartment_id
             WHERE a.building_id = $1 AND pm.month = $2) AS paid,
            (SELECT count(*)::int FROM apartments WHERE building_id = $1) AS total`, [buildingId, toMonth(today)]);
  const expenses = await query<Summary["expenses"][number]>(
    `SELECT e.id, e.description, s.name AS service, e.amount_cents, to_char(e.paid_on, 'YYYY-MM-DD') AS paid_on, e.invoice_name
     FROM expenses e JOIN services s ON s.id = e.service_id WHERE e.building_id = $1 ORDER BY e.paid_on DESC, e.created_at DESC`,
    [buildingId]);
  const income = Number(inc.s), spent = Number(exp.s);
  return { incomeCents: income, expenseCents: spent, balanceCents: income - spent, paidThisMonth: col.paid, apartments: col.total, expenses };
}

/** Returns the invoice file only if this user may see the expense's building. */
export async function invoiceFor(user: User | null, buildingId: string, expenseId: string) {
  if (!(await canSeeBuilding(user, buildingId)) || !/^[0-9a-f-]{36}$/i.test(expenseId)) return null;
  const [e] = await query<{ invoice_path: string; invoice_name: string }>(
    "SELECT invoice_path, invoice_name FROM expenses WHERE id = $1 AND building_id = $2", [expenseId, buildingId]);
  if (!e) return null;
  const ext = e.invoice_path.split(".").pop()!;
  const type = Object.entries(TYPES).find(([, x]) => x === ext)?.[0] ?? "application/octet-stream";
  return { bytes: await readFile(join(UPLOAD_DIR, e.invoice_path)), type, name: e.invoice_name };
}
