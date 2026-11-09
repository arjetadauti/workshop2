"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { managedBuilding } from "@/lib/buildings";
import { query } from "@/lib/db";
import { parseAmount } from "@/lib/money";
import { toMonth } from "@/lib/months";
import { COUNTRIES, normalizePhone, type Country } from "@/lib/phone";
import { sendSms, smsText, type Lang } from "@/lib/sms";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (id: string, q: string) => redirect(`/manager/buildings/${id}?${q}`);
const isUnique = (e: unknown) => (e as { code?: string })?.code === "23505";

export async function createBuilding(f: FormData) {
  const m = await requireManager();
  const country = s(f, "country") as Country;
  const name = s(f, "name");
  const start = s(f, "start_month"); // "YYYY-MM"
  if (!name || !(country in COUNTRIES) || !/^\d{4}-\d{2}$/.test(start)) redirect("/manager?err=invalid");
  const [b] = await query<{ id: string }>(
    `INSERT INTO buildings (manager_id, name, country, currency, start_month) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [m.id, name, country, COUNTRIES[country].currency, `${start}-01`]);
  redirect(`/manager/buildings/${b.id}`);
}

export async function addApartment(f: FormData) {
  const m = await requireManager();
  const b = await managedBuilding(m.id, s(f, "building_id"));
  const number = s(f, "number");
  const floor = Number(s(f, "floor"));
  if (!number || !Number.isInteger(floor) || floor < 0 || floor > 200) back(b.id, "err=invalid");
  try {
    await query("INSERT INTO apartments (building_id, number, floor) VALUES ($1, $2, $3)", [b.id, number, floor]);
  } catch (e) {
    if (isUnique(e)) back(b.id, "err=duplicate");
    throw e;
  }
  revalidatePath(`/manager/buildings/${b.id}`);
  back(b.id, "ok=saved");
}

export async function addService(f: FormData) {
  const m = await requireManager();
  const b = await managedBuilding(m.id, s(f, "building_id"));
  const name = s(f, "name");
  if (!name) back(b.id, "err=invalid");
  try {
    await query("INSERT INTO services (building_id, name) VALUES ($1, $2)", [b.id, name]);
  } catch (e) {
    if (isUnique(e)) back(b.id, "err=duplicate");
    throw e;
  }
  back(b.id, "ok=saved");
}

export async function setPrice(f: FormData) {
  const m = await requireManager();
  const b = await managedBuilding(m.id, s(f, "building_id"));
  const floor = Number(s(f, "floor"));
  const cents = parseAmount(s(f, "amount"));
  const from = s(f, "valid_from") ? `${s(f, "valid_from")}-01` : b.start_month;
  if (!Number.isInteger(floor) || floor < 0 || cents === null || !/^\d{4}-\d{2}-01$/.test(from)) back(b.id, "err=invalid");
  // The service must belong to this building (checked in the same statement).
  const rows = await query(
    `INSERT INTO prices (service_id, floor, amount_cents, valid_from)
     SELECT id, $3, $4, $5 FROM services WHERE id = $1 AND building_id = $2
     ON CONFLICT (service_id, floor, valid_from) DO NOTHING RETURNING id`,
    [s(f, "service_id"), b.id, floor, cents, toMonth(from)]);
  back(b.id, rows.length ? "ok=saved" : "err=duplicate");
}

export async function inviteResident(f: FormData) {
  const m = await requireManager();
  const b = await managedBuilding(m.id, s(f, "building_id"));
  const phone = normalizePhone(s(f, "phone"), COUNTRIES[b.country as Country].phone);
  const lang = (["sq", "mk", "en"].includes(s(f, "language")) ? s(f, "language") : "sq") as Lang;
  const first = s(f, "first_name"), last = s(f, "last_name");
  if (!phone || !first || !last) back(b.id, "err=invalid");
  const [apt] = await query<{ id: string; number: string }>(
    "SELECT id, number FROM apartments WHERE id = $1 AND building_id = $2", [s(f, "apartment_id"), b.id]);
  if (!apt) back(b.id, "err=invalid");
  const clash = await query("SELECT 1 FROM managers WHERE phone = $1", [phone]);
  if (clash.length) back(b.id, "err=phone");
  try {
    await query(
      `INSERT INTO residents (apartment_id, first_name, last_name, phone, language) VALUES ($1, $2, $3, $4, $5)`,
      [apt.id, first, last, phone, lang]);
  } catch (e) {
    if (isUnique(e)) back(b.id, "err=phone");
    throw e;
  }
  const link = `${process.env.APP_URL ?? "http://localhost:3000"}/login`;
  await sendSms(phone!, smsText.invite(lang, first, `${b.name}, ${lang === "mk" ? "Стан" : lang === "en" ? "Apt" : "Banesa"} ${apt.number}`, link));
  back(b.id, "ok=invited");
}

export async function recordCash(f: FormData) {
  const m = await requireManager();
  const b = await managedBuilding(m.id, s(f, "building_id"));
  const { recordCashPayment, PaymentError } = await import("@/lib/payments");
  const { formatMoney } = await import("@/lib/money");
  const { monthsLabel } = await import("@/lib/months");
  const to = (q: string) => redirect(`/manager/buildings/${b.id}/payments?${q}`);
  let result;
  try {
    result = await recordCashPayment({
      managerId: m.id, apartmentId: s(f, "apartment_id"), monthCount: Number(s(f, "months")), receiptNo: s(f, "receipt_no"),
    });
  } catch (e) {
    if (e instanceof PaymentError) to(`err=${e.code}`);
    throw e;
  }
  // SMS confirmation to the apartment's active residents (SPEC 6.3 step 4), after the transaction committed.
  const people = await query<{ phone: string; language: Lang }>(
    "SELECT phone, language FROM residents WHERE apartment_id = $1 AND removed_at IS NULL", [s(f, "apartment_id")]);
  for (const r of people)
    await sendSms(r.phone, smsText.cashRecorded(r.language, formatMoney(result!.amountCents, result!.currency),
      monthsLabel(result!.months, r.language), result!.apartmentNumber, s(f, "receipt_no")));
  to("ok=paid");
}
