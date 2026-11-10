import { query } from "@/lib/db";
import { managerContext } from "@/lib/manager-page";
import { formatMoney } from "@/lib/money";
import { monthLabel } from "@/lib/months";
import { apartmentDebt } from "@/lib/payments";
import { recordCash } from "../../../actions";
import { Flash, managerMenu, Shell } from "../../../../shell";

export default async function PaymentsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { m, b, tx, buildings } = await managerContext((await params).id);
  const q = await searchParams;
  const apartments = await query<{ id: string; number: string; floor: number }>(
    "SELECT id, number, floor FROM apartments WHERE building_id = $1 ORDER BY floor, number", [b.id]);
  const status = await Promise.all(apartments.map(async (a) => ({ ...a, d: await apartmentDebt(a.id) })));
  const recent = await query<{ id: string; number: string; amount_cents: string; receipt_no: string; paid_at: string; months: number }>(
    `SELECT p.id, a.number, p.amount_cents, p.receipt_no, to_char(p.paid_at, 'YYYY-MM-DD') AS paid_at,
            (SELECT count(*)::int FROM payment_months pm WHERE pm.payment_id = p.id) AS months
     FROM payments p JOIN apartments a ON a.id = p.apartment_id WHERE p.building_id = $1 ORDER BY p.paid_at DESC LIMIT 10`, [b.id]);
  const err = { receipt_used: tx.errReceipt, price_missing: tx.errPrice, invalid: tx.errInvalid, not_found: tx.errInvalid }[q.err ?? ""];
  return (
    <Shell user={m} menu={managerMenu(b.id, tx)} active={`/manager/buildings/${b.id}/payments`} title={tx.paymentsMenu} subtitle={b.name} buildings={buildings}>
      <Flash ok={q.ok ? tx.paymentSaved : null} err={err} />
      {apartments.length === 0 ? <p className="msg bad">{tx.needApartments}</p> : (
        <form action={recordCash} className="card">
          <h2>💶 {tx.recordCash}</h2>
          <input type="hidden" name="building_id" value={b.id} />
          <div className="row">
            <div><label>{tx.apartment}</label>
              <select name="apartment_id">{apartments.map((a) => <option key={a.id} value={a.id}>{a.number} ({tx.floorShort} {a.floor})</option>)}</select></div>
            <div><label>{tx.months}</label>
              <select name="months"><option value="1">{tx.monthsOne}</option><option value="3">{tx.monthsThree}</option><option value="12">{tx.monthsYear}</option></select></div>
            <div><label>{tx.receiptNo}</label><input name="receipt_no" required placeholder="0142" /></div>
          </div>
          <div className="form-end"><button type="submit">✓ {tx.record}</button></div>
        </form>
      )}
      <div className="card">
        <h2>{tx.status}</h2>
        <table>
          <thead><tr><th>{tx.apartment}</th><th>{tx.paidUntil}</th><th className="num">{tx.status}</th></tr></thead>
          <tbody>{status.map((a) => (
            <tr key={a.id}>
              <td><strong>{a.number}</strong> <span className="muted small">· {tx.floorShort} {a.floor}</span></td>
              <td>{a.d.paidUpTo ? monthLabel(a.d.paidUpTo, m.lang) : <span className="muted">—</span>}</td>
              <td className="num">{a.d.unpaid.length === 0
                ? <span className="badge ok">✓ {tx.paid}</span>
                : <span className="badge bad">{tx.owes} {a.d.unpaid.length} {tx.months.toLowerCase()} · {a.d.amountCents >= 0 ? formatMoney(a.d.amountCents, b.currency) : "?"}</span>}</td>
            </tr>))}</tbody>
        </table>
      </div>
      <div className="card">
        <h2>🕘 {tx.payments}</h2>
        {recent.length === 0 ? <p className="empty">{tx.noPayYet}</p> : (
          <table><thead><tr><th>{tx.date}</th><th>{tx.apartment}</th><th>{tx.months}</th><th>{tx.receiptNo}</th><th className="num">{tx.amount}</th></tr></thead>
            <tbody>{recent.map((p) => <tr key={p.id}><td>{p.paid_at}</td><td>{p.number}</td><td>{p.months}</td><td>{p.receipt_no}</td><td className="num">{formatMoney(p.amount_cents, b.currency)}</td></tr>)}</tbody></table>
        )}
      </div>
    </Shell>
  );
}
