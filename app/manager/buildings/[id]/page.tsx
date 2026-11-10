import Link from "next/link";
import { query } from "@/lib/db";
import { buildingSummary } from "@/lib/expenses";
import { managerContext } from "@/lib/manager-page";
import { formatMoney } from "@/lib/money";
import { monthLabel } from "@/lib/months";
import { apartmentDebt } from "@/lib/payments";
import { managerMenu, Shell } from "../../../shell";

export default async function Dashboard({ params }: { params: Promise<{ id: string }> }) {
  const { m, b, tx, buildings } = await managerContext((await params).id);
  const base = `/manager/buildings/${b.id}`;
  const sum = await buildingSummary(b.id);
  const apartments = await query<{ id: string; number: string; floor: number }>(
    "SELECT id, number, floor FROM apartments WHERE building_id = $1 ORDER BY floor, number", [b.id]);
  const [counts] = await query<{ services: number; prices: number; residents: number }>(
    `SELECT (SELECT count(*)::int FROM services WHERE building_id = $1) AS services,
            (SELECT count(*)::int FROM prices p JOIN services s ON s.id = p.service_id WHERE s.building_id = $1) AS prices,
            (SELECT count(*)::int FROM residents r JOIN apartments a ON a.id = r.apartment_id WHERE a.building_id = $1 AND r.removed_at IS NULL) AS residents`, [b.id]);
  const debts = await Promise.all(apartments.map(async (a) => ({ ...a, d: await apartmentDebt(a.id) })));
  const owing = debts.filter((x) => x.d.unpaid.length > 0);

  const steps = [
    { done: apartments.length > 0, label: tx.apartmentsMenu, href: `${base}/apartments` },
    { done: counts.services > 0 && counts.prices > 0, label: tx.servicesMenu, href: `${base}/services` },
    { done: counts.residents > 0, label: tx.residentsMenu, href: `${base}/residents` },
  ];
  const setupDone = steps.every((s) => s.done);

  return (
    <Shell user={m} menu={managerMenu(b.id, tx)} active={base} title={b.name} subtitle={`${tx.dashboard} · ${b.currency}`} buildings={buildings}>
      {!setupDone && (
        <div className="card">
          <h2>⚙️ {tx.setupGuide}</h2>
          <div className="steps">
            {steps.map((s, i) => (
              <Link key={s.href} href={s.href} className={s.done ? "done" : ""}>
                {s.done ? "✅" : "⬜"} {tx.step} {i + 1}: {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="stats">
        <div className="stat"><div className="label">💰 {tx.balance}</div>
          <div className={`value ${sum.balanceCents < 0 ? "bad" : ""}`}>{formatMoney(sum.balanceCents, b.currency)}</div>
          <div className="muted small">{tx.income} {formatMoney(sum.incomeCents, b.currency)} · {tx.expenses} {formatMoney(sum.expenseCents, b.currency)}</div></div>
        <div className="stat"><div className="label">✅ {tx.paidThisMonth}</div>
          <div className="value">{sum.paidThisMonth} / {sum.apartments}</div>
          <div className="muted small">{sum.apartments ? Math.round((100 * sum.paidThisMonth) / sum.apartments) : 0}%</div></div>
        <div className="stat"><div className="label">⚠️ {tx.owing}</div>
          <div className={`value ${owing.length ? "bad" : "ok"}`}>{owing.length}</div></div>
      </div>

      <div className="card">
        <h2>{tx.quick}</h2>
        <div className="actions">
          <Link className="btn" href={`${base}/payments`}>💶 {tx.recordCash}</Link>
          <Link className="btn light" href={`${base}/expenses`}>🧾 {tx.recordExpense}</Link>
          <Link className="btn light" href={`${base}/residents`}>👥 {tx.invite}</Link>
        </div>
      </div>

      <div className="card">
        <h2>⚠️ {tx.owing}</h2>
        {owing.length === 0 ? <p className="empty">{apartments.length ? tx.allPaid : tx.emptyApartments}</p> : (
          <table>
            <thead><tr><th>{tx.apartment}</th><th>{tx.months}</th><th className="num">{tx.owes}</th></tr></thead>
            <tbody>{owing.map((x) => (
              <tr key={x.id}>
                <td><strong>{x.number}</strong> <span className="muted small">· {tx.floorShort} {x.floor}</span></td>
                <td>{x.d.unpaid.length} {tx.monthsUnpaid} <span className="muted small">({monthLabel(x.d.unpaid[0], m.lang)}…)</span></td>
                <td className="num"><span className="badge bad">{x.d.amountCents >= 0 ? formatMoney(x.d.amountCents, b.currency) : "?"}</span></td>
              </tr>))}</tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
