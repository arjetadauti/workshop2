import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { buildingById } from "@/lib/buildings";
import { query } from "@/lib/db";
import { buildingSummary, canSeeBuilding } from "@/lib/expenses";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { Nav } from "../../nav";
import { recordExpenseAction } from "../actions";

// Shared with every resident of the building: totals only, never names or apartments (SPEC 7.3).
export default async function BuildingPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const tx = t(user.lang);
  if (!(await canSeeBuilding(user, id))) return <><h1>403</h1><p className="bad">{tx.noAccess}</p></>;
  const b = (await buildingById(id))!;
  const sum = await buildingSummary(id);
  const q = await searchParams;
  const isManager = user.kind === "manager";
  const services = isManager ? await query<{ id: string; name: string }>("SELECT id, name FROM services WHERE building_id = $1 ORDER BY name", [id]) : [];
  const links = isManager
    ? [{ href: "/manager", label: tx.buildings }, { href: `/manager/buildings/${id}`, label: tx.setup },
       { href: `/manager/buildings/${id}/payments`, label: tx.payments }, { href: `/building/${id}`, label: tx.building }]
    : [{ href: "/me", label: tx.myApartment }, { href: `/building/${id}`, label: tx.building }];
  const err = { invalid: tx.errInvalid, no_invoice: tx.errNoInvoice, bad_invoice: tx.errBadInvoice, not_found: tx.errInvalid }[q.err ?? ""];

  return (
    <>
      <Nav user={user} links={links} />
      <h1>{b.name}</h1>
      {q.ok === "expense" && <p className="msg ok">{tx.expenseSaved}</p>}
      {err && <p className="msg bad">{err}</p>}
      <div className="card">
        <div className="muted">{tx.balance}</div>
        <div className={`big ${sum.balanceCents < 0 ? "bad" : ""}`}>{formatMoney(sum.balanceCents, b.currency)}</div>
        <div className="muted">{tx.income} {formatMoney(sum.incomeCents, b.currency)} · {tx.expenses} {formatMoney(sum.expenseCents, b.currency)}</div>
        <p style={{ marginBottom: 0 }}><strong>{sum.paidThisMonth} {tx.of} {sum.apartments}</strong> {tx.collected}
          {sum.apartments > 0 && ` (${Math.round((100 * sum.paidThisMonth) / sum.apartments)}%)`}</p>
      </div>

      <h2>{tx.expenses}</h2>
      <div className="card scroll">
        {sum.expenses.length === 0 ? <p className="muted">{tx.noneYet}</p> : (
          <table>
            <thead><tr><th>{tx.date}</th><th>{tx.description}</th><th>{tx.service}</th><th className="num">{tx.amount}</th><th></th></tr></thead>
            <tbody>{sum.expenses.map((e) => (
              <tr key={e.id}><td>{e.paid_on}</td><td>{e.description}</td><td>{e.service}</td>
                <td className="num">{formatMoney(e.amount_cents, b.currency)}</td>
                <td><a href={`/building/${id}/invoice/${e.id}`} target="_blank" rel="noreferrer">{tx.openInvoice}</a></td></tr>))}</tbody>
          </table>
        )}
      </div>

      {isManager && services.length > 0 && (
        <form action={recordExpenseAction} className="card">
          <h2 style={{ marginTop: 0 }}>{tx.recordExpense}</h2>
          <input type="hidden" name="building_id" value={id} />
          <label>{tx.description}</label><input name="description" required placeholder="Riparimi i ashensorit" />
          <div className="row">
            <div><label>{tx.service}</label><select name="service_id">{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label>{tx.amount} ({b.currency})</label><input name="amount" inputMode="decimal" required /></div>
            <div><label>{tx.date}</label><input name="paid_on" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></div>
          </div>
          <label>{tx.invoice}</label><input name="invoice" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required />
          <button type="submit">{tx.recordExpense}</button>
        </form>
      )}
    </>
  );
}
