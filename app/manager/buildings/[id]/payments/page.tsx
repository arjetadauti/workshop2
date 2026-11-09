import { requireManager } from "@/lib/auth";
import { managedBuilding } from "@/lib/buildings";
import { query } from "@/lib/db";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { addMonths, monthLabel, monthRange, toMonth } from "@/lib/months";
import { Nav } from "../../../../nav";
import { recordCash } from "../../../actions";

export default async function PaymentsPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const m = await requireManager();
  const b = await managedBuilding(m.id, (await params).id);
  const tx = t(m.lang);
  const q = await searchParams;
  const apartments = await query<{ id: string; number: string; floor: number }>(
    "SELECT id, number, floor FROM apartments WHERE building_id = $1 ORDER BY floor, number", [b.id]);
  const paid = await query<{ apartment_id: string; month: string; receipt_no: string; amount_cents: string }>(
    `SELECT pm.apartment_id, to_char(pm.month, 'YYYY-MM-DD') AS month, p.receipt_no, pm.amount_cents
     FROM payment_months pm JOIN payments p ON p.id = pm.payment_id WHERE p.building_id = $1`, [b.id]);
  const paidMap = new Map(paid.map((p) => [`${p.apartment_id}:${p.month}`, p]));
  const months = monthRange(b.start_month, addMonths(toMonth(new Date()), 0)).slice(-12);
  const err = { receipt_used: tx.errReceipt, price_missing: tx.errPrice, invalid: tx.errInvalid, not_found: tx.errInvalid }[q.err ?? ""];

  return (
    <>
      <Nav user={m} links={[{ href: "/manager", label: tx.buildings }, { href: `/manager/buildings/${b.id}`, label: tx.setup },
        { href: `/manager/buildings/${b.id}/payments`, label: tx.payments }, { href: `/building/${b.id}`, label: tx.building }]} />
      <h1>{tx.payments} · {b.name}</h1>
      {q.ok === "paid" && <p className="msg ok">{tx.paymentSaved}</p>}
      {err && <p className="msg bad">{err}</p>}

      <form action={recordCash} className="card">
        <h2 style={{ marginTop: 0 }}>{tx.recordCash}</h2>
        <input type="hidden" name="building_id" value={b.id} />
        <div className="row">
          <div><label>{tx.apartment}</label>
            <select name="apartment_id">{apartments.map((a) => <option key={a.id} value={a.id}>{a.number} ({tx.floorShort} {a.floor})</option>)}</select></div>
          <div><label>{tx.months}</label>
            <select name="months"><option value="1">{tx.monthsOne}</option><option value="3">{tx.monthsThree}</option><option value="12">{tx.monthsYear}</option></select></div>
          <div><label>{tx.receiptNo}</label><input name="receipt_no" required /></div>
        </div>
        <button type="submit">{tx.record}</button>
      </form>

      <div className="card scroll">
        <table>
          <thead><tr><th>{tx.apartment}</th>{months.map((mo) => <th key={mo} className="num">{monthLabel(mo, m.lang).slice(0, 3)} {mo.slice(2, 4)}</th>)}</tr></thead>
          <tbody>{apartments.map((a) => (
            <tr key={a.id}><td>{a.number}</td>{months.map((mo) => {
              const p = paidMap.get(`${a.id}:${mo}`);
              return <td key={mo} className={`num ${p ? "ok" : "bad"}`} title={p ? `${tx.receiptNo} ${p.receipt_no} · ${formatMoney(p.amount_cents, b.currency)}` : tx.unpaid}>{p ? "✓" : "·"}</td>;
            })}</tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
