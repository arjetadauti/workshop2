// Check for M3 (issue #3): expenses with invoices, building balance, building isolation.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
process.env.UPLOAD_DIR = mkdtempSync(join(tmpdir(), "invoices-"));
import { query } from "@/lib/db";
import { requestCode, userForToken, verifyCode } from "@/lib/auth-core";
import { buildingSummary, canSeeBuilding, ExpenseError, invoiceFor, recordExpense } from "@/lib/expenses";
import { recordCashPayment } from "@/lib/payments";
import { demoBuilding, lastCode, reset } from "./helpers";

const pdf = { name: "fatura.pdf", type: "application/pdf", bytes: Buffer.from("%PDF-1.4 test") };
const loginAs = async (phone: string) => {
  await requestCode(phone);
  return userForToken((await verifyCode(phone, lastCode(phone)))!);
};

describe("M3 expenses and balance", () => {
  beforeEach(reset);

  it("a 50 EUR expense lowers the balance by 50 and shows in the list", async () => {
    const d = await demoBuilding("2026-01-01");
    await recordCashPayment({ managerId: d.managerId, apartmentId: d.apt1, monthCount: 12, receiptNo: "1" }); // 180 EUR
    const before = await buildingSummary(d.buildingId);
    await recordExpense({ managerId: d.managerId, buildingId: d.buildingId, serviceId: d.liftId,
      description: "Riparimi i ashensorit", amountCents: 5000, paidOn: "2026-03-10", invoice: pdf });
    const after = await buildingSummary(d.buildingId);
    expect(before.balanceCents).toBe(18000);
    expect(before.balanceCents - after.balanceCents).toBe(5000);
    expect(after.expenses).toHaveLength(1);
    expect(after.expenses[0]).toMatchObject({ description: "Riparimi i ashensorit", service: "Ashensori", paid_on: "2026-03-10" });
  });

  it("an expense without an invoice, or with a wrong file type, is rejected", async () => {
    const d = await demoBuilding();
    const base = { managerId: d.managerId, buildingId: d.buildingId, serviceId: d.cleanId, description: "X", amountCents: 100, paidOn: "2026-02-01" };
    await expect(recordExpense({ ...base, invoice: null })).rejects.toEqual(new ExpenseError("no_invoice"));
    await expect(recordExpense({ ...base, invoice: { name: "a.html", type: "text/html", bytes: Buffer.from("<x>") } }))
      .rejects.toEqual(new ExpenseError("bad_invoice"));
    expect((await buildingSummary(d.buildingId)).expenses).toHaveLength(0);
  });

  it("every resident of the building can open the invoice; a resident of another building can not", async () => {
    const d = await demoBuilding();
    const other = await demoBuilding();
    const id = await recordExpense({ managerId: d.managerId, buildingId: d.buildingId, serviceId: d.cleanId,
      description: "Pastrimi", amountCents: 2000, paidOn: "2026-02-01", invoice: pdf });
    const insider = await loginAs(d.r0.phone);
    const outsider = await loginAs(other.r0.phone);
    expect(await canSeeBuilding(insider, d.buildingId)).toBe(true);
    expect((await invoiceFor(insider, d.buildingId, id))?.bytes.toString()).toBe("%PDF-1.4 test");
    expect(await canSeeBuilding(outsider, d.buildingId)).toBe(false);
    expect(await invoiceFor(outsider, d.buildingId, id)).toBeNull();
    expect(await invoiceFor(outsider, other.buildingId, id)).toBeNull(); // expense id from another building
  });

  it("a manager can not add an expense to another manager's building", async () => {
    const d = await demoBuilding();
    const other = await demoBuilding();
    await expect(recordExpense({ managerId: other.managerId, buildingId: d.buildingId, serviceId: d.cleanId,
      description: "X", amountCents: 100, paidOn: "2026-02-01", invoice: pdf })).rejects.toEqual(new ExpenseError("not_found"));
  });

  it("the collection rate counts apartments, without names", async () => {
    const d = await demoBuilding("2026-01-01");
    await recordCashPayment({ managerId: d.managerId, apartmentId: d.apt0, monthCount: 1, receiptNo: "9" });
    const s = await buildingSummary(d.buildingId, new Date("2026-01-20T00:00:00Z"));
    expect([s.paidThisMonth, s.apartments]).toEqual([1, 2]);
    expect(JSON.stringify(s)).not.toMatch(/"number"|first_name|phone/);
  });

  it("expenses can not be edited or deleted", async () => {
    const d = await demoBuilding();
    await recordExpense({ managerId: d.managerId, buildingId: d.buildingId, serviceId: d.cleanId,
      description: "X", amountCents: 100, paidOn: "2026-02-01", invoice: pdf });
    await expect(query("UPDATE expenses SET amount_cents = 1")).rejects.toThrow(/can not be changed/);
  });
});
