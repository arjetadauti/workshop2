"use server";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { ExpenseError, recordExpense } from "@/lib/expenses";
import { parseAmount } from "@/lib/money";

export async function recordExpenseAction(f: FormData) {
  const m = await requireManager();
  const buildingId = String(f.get("building_id") ?? "");
  const file = f.get("invoice");
  const invoice = file instanceof File && file.size > 0
    ? { name: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) } : null;
  try {
    await recordExpense({
      managerId: m.id, buildingId, serviceId: String(f.get("service_id") ?? ""),
      description: String(f.get("description") ?? ""), amountCents: parseAmount(String(f.get("amount") ?? "")),
      paidOn: String(f.get("paid_on") ?? ""), invoice,
    });
  } catch (e) {
    if (e instanceof ExpenseError) redirect(`/building/${buildingId}?err=${e.code}`);
    throw e;
  }
  redirect(`/building/${buildingId}?ok=expense`);
}
