// Check for M2 (issue #2): cash payments, oldest month first, no double payment.
import { beforeEach, describe, expect, it } from "vitest";
import { query } from "@/lib/db";
import { apartmentMonths, recordCashPayment, PaymentError } from "@/lib/payments";
import { demoBuilding, reset } from "./helpers";

const pay = (managerId: string, apartmentId: string, monthCount: number, receiptNo: string) =>
  recordCashPayment({ managerId, apartmentId, monthCount, receiptNo });

describe("M2 cash payments", () => {
  beforeEach(reset);

  it("3 months cash: exactly the 3 oldest months become paid, at the floor price", async () => {
    const d = await demoBuilding("2026-01-01");
    const r = await pay(d.managerId, d.apt1, 3, "0142");
    expect(r.months).toEqual(["2026-01-01", "2026-02-01", "2026-03-01"]);
    expect(r.amountCents).toBe(3 * 1500); // floor 1: cleaning 5 + elevator 10
    const months = await apartmentMonths(d.apt1, new Date("2026-06-20T00:00:00Z"));
    expect(months.filter((m) => m.paid).map((m) => m.month)).toEqual(r.months);
    expect(months.find((m) => m.month === "2026-04-01")).toMatchObject({ paid: false, overdue: true });
  });

  it("the ground floor does not pay for the elevator", async () => {
    const d = await demoBuilding();
    expect((await pay(d.managerId, d.apt0, 1, "1")).amountCents).toBe(500);
  });

  it("the next payment continues after the paid months, so a month is never paid twice", async () => {
    const d = await demoBuilding("2026-01-01");
    await pay(d.managerId, d.apt1, 3, "A1");
    const r = await pay(d.managerId, d.apt1, 1, "A2");
    expect(r.months).toEqual(["2026-04-01"]);
  });

  it("the database itself rejects a second payment for the same month", async () => {
    const d = await demoBuilding("2026-01-01");
    await pay(d.managerId, d.apt1, 1, "B1");
    const [p] = await query<{ id: string }>(
      "INSERT INTO payments (apartment_id, building_id, method, amount_cents, receipt_no) VALUES ($1, $2, 'cash', 1500, 'B2') RETURNING id",
      [d.apt1, d.buildingId]);
    await expect(query(
      "INSERT INTO payment_months (payment_id, apartment_id, month, amount_cents) VALUES ($1, $2, '2026-01-01', 1500)",
      [p.id, d.apt1])).rejects.toThrow(/unique/i);
  });

  it("a receipt number can be used only once per building, and nothing is saved", async () => {
    const d = await demoBuilding();
    await pay(d.managerId, d.apt1, 1, "0142");
    await expect(pay(d.managerId, d.apt0, 1, "0142")).rejects.toEqual(new PaymentError("receipt_used"));
    expect((await apartmentMonths(d.apt0)).some((m) => m.paid)).toBe(false);
  });

  it("a manager can not record a payment for another manager's apartment", async () => {
    const d = await demoBuilding();
    const other = await demoBuilding();
    await expect(pay(other.managerId, d.apt1, 1, "X")).rejects.toEqual(new PaymentError("not_found"));
  });

  it("payments can not be edited or deleted", async () => {
    const d = await demoBuilding();
    await pay(d.managerId, d.apt1, 1, "C1");
    await expect(query("UPDATE payments SET amount_cents = 1")).rejects.toThrow(/can not be changed/);
    await expect(query("DELETE FROM payment_months")).rejects.toThrow(/can not be changed/);
  });

  it("a missing price stops the payment instead of charging 0", async () => {
    const d = await demoBuilding();
    await query("INSERT INTO services (building_id, name) VALUES ($1, 'Drita')", [d.buildingId]);
    await expect(pay(d.managerId, d.apt1, 1, "D1")).rejects.toEqual(new PaymentError("price_missing"));
  });

  it("12 months can be paid in advance", async () => {
    const d = await demoBuilding("2026-11-01");
    const r = await pay(d.managerId, d.apt0, 12, "Y1");
    expect(r.months.at(-1)).toBe("2027-10-01");
    expect(r.amountCents).toBe(12 * 500);
  });
});
