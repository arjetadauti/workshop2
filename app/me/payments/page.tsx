import { requireResident } from "@/lib/auth";
import { buildingById } from "@/lib/buildings";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { monthLabel } from "@/lib/months";
import { apartmentMonths } from "@/lib/payments";
import { residentMenu, Shell } from "../../shell";

export default async function MyPayments() {
  const r = await requireResident();
  const tx = t(r.lang);
  const b = (await buildingById(r.buildingId))!;
  const months = (await apartmentMonths(r.apartmentId)).reverse();
  return (
    <Shell user={r} menu={residentMenu(r.buildingId, tx)} active="/me/payments" title={tx.myPayments} subtitle={`${tx.apartment} ${r.apartmentNumber}`}>
      <div className="card scroll">
        <table>
          <thead><tr><th>{tx.month}</th><th>{tx.status}</th><th className="num">{tx.amount}</th><th>{tx.receiptNo}</th></tr></thead>
          <tbody>{months.map((m) => (
            <tr key={m.month}>
              <td><strong>{monthLabel(m.month, r.lang)}</strong></td>
              <td>{m.paid ? <span className="badge ok">✓ {tx.paid}</span> : m.overdue ? <span className="badge bad">{tx.overdue}</span> : <span className="badge muted">{tx.unpaid}</span>}</td>
              <td className="num">{m.amountCents !== null ? formatMoney(m.amountCents, b.currency) : ""}</td>
              <td>{m.receiptNo ?? ""}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </Shell>
  );
}
