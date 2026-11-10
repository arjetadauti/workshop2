import { query } from "@/lib/db";
import { buildingSummary } from "@/lib/expenses";
import { managerContext } from "@/lib/manager-page";
import { recordExpenseAction } from "../../../../building/actions";
import { BalanceStats, ExpenseList } from "../../../../expense-list";
import { Flash, managerMenu, Shell } from "../../../../shell";

export default async function Expenses({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { m, b, tx, buildings } = await managerContext((await params).id);
  const q = await searchParams;
  const sum = await buildingSummary(b.id);
  const services = await query<{ id: string; name: string }>("SELECT id, name FROM services WHERE building_id = $1 ORDER BY name", [b.id]);
  const err = { invalid: tx.errInvalid, no_invoice: tx.errNoInvoice, bad_invoice: tx.errBadInvoice, not_found: tx.errInvalid }[q.err ?? ""];
  return (
    <Shell user={m} menu={managerMenu(b.id, tx)} active={`/manager/buildings/${b.id}/expenses`} title={tx.expensesMenu} subtitle={b.name} buildings={buildings}>
      <Flash ok={q.ok ? tx.expenseSaved : null} err={err} />
      <BalanceStats sum={sum} currency={b.currency} tx={tx} />
      {services.length === 0 ? <p className="msg bad">{tx.needServices}</p> : (
        <form action={recordExpenseAction} className="card">
          <h2>🧾 {tx.recordExpense}</h2>
          <input type="hidden" name="building_id" value={b.id} />
          <label>{tx.description}</label><input name="description" required placeholder="Elevator repair" />
          <div className="row">
            <div><label>{tx.service}</label><select name="service_id">{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label>{tx.amount} ({b.currency})</label><input name="amount" inputMode="decimal" required placeholder="50" /></div>
            <div><label>{tx.date}</label><input name="paid_on" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></div>
          </div>
          <label>{tx.invoice}</label><input name="invoice" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required />
          <div className="form-end"><button type="submit">✓ {tx.recordExpense}</button></div>
        </form>
      )}
      <div className="card"><h2>{tx.whereMoneyWent}</h2><ExpenseList sum={sum} buildingId={b.id} currency={b.currency} tx={tx} /></div>
    </Shell>
  );
}
