import Link from "next/link";
import { requireResident } from "@/lib/auth";
import { buildingById } from "@/lib/buildings";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { monthLabel } from "@/lib/months";
import { apartmentMonths } from "@/lib/payments";
import { Nav } from "../nav";

// Shows ONLY the logged-in resident's apartment: the id comes from the session, never from the URL.
export default async function MePage() {
  const r = await requireResident();
  const tx = t(r.lang);
  const b = await buildingById(r.buildingId);
  const months = (await apartmentMonths(r.apartmentId)).reverse();
  return (
    <>
      <Nav user={r} links={[{ href: "/me", label: tx.myApartment }, { href: `/building/${r.buildingId}`, label: tx.building }]} />
      <h1>{tx.welcome}, {r.firstName}</h1>
      <div className="card">
        <div>{tx.building}: <strong>{b?.name}</strong></div>
        <div>{tx.apartment}: <strong>{r.apartmentNumber}</strong> · {tx.floorShort} {r.floor}</div>
      </div>
      <h2>{tx.myPayments}</h2>
      <div className="card">
        <table>
          <thead><tr><th>{tx.month}</th><th>{tx.status}</th><th className="num">{tx.amount}</th><th>{tx.receiptNo}</th></tr></thead>
          <tbody>{months.map((m) => (
            <tr key={m.month}>
              <td>{monthLabel(m.month, r.lang)}</td>
              <td className={m.paid ? "ok" : m.overdue ? "bad" : "muted"}>{m.paid ? `✓ ${tx.paid}` : m.overdue ? tx.overdue : tx.unpaid}</td>
              <td className="num">{m.amountCents !== null && b ? formatMoney(m.amountCents, b.currency) : ""}</td>
              <td>{m.receiptNo ?? ""}</td>
            </tr>))}</tbody>
        </table>
      </div>
      <p className="muted"><Link href={`/building/${r.buildingId}`}>{tx.building} →</Link></p>
    </>
  );
}
