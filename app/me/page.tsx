import Link from "next/link";
import { requireResident } from "@/lib/auth";
import { buildingById } from "@/lib/buildings";
import { buildingSummary } from "@/lib/expenses";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { monthLabel } from "@/lib/months";
import { apartmentDebt } from "@/lib/payments";
import { residentMenu, Shell } from "../shell";

// The resident's home: one clear answer first. Data comes from the session's apartment only.
export default async function ResidentHome() {
  const r = await requireResident();
  const tx = t(r.lang);
  const b = (await buildingById(r.buildingId))!;
  const d = await apartmentDebt(r.apartmentId);
  const sum = await buildingSummary(r.buildingId);
  const ok = d.unpaid.length === 0;
  return (
    <Shell user={r} menu={residentMenu(r.buildingId, tx)} active="/me" title={`${tx.welcome}, ${r.firstName}`}
      subtitle={`${b.name} · ${tx.apartment} ${r.apartmentNumber} · ${tx.floorShort} ${r.floor}`}>
      <div className={`hero ${ok ? "good" : "warn"}`}>
        {ok ? (<>
          <div className="big">✓ {tx.upToDate}</div>
          <p>{d.paidUpTo ? `${tx.paidUntil} ${monthLabel(d.paidUpTo, r.lang)}` : ""}</p>
        </>) : (<>
          <div className="big">{tx.youOwe} {d.amountCents >= 0 ? formatMoney(d.amountCents, b.currency) : ""}</div>
          <p>{d.unpaid.length} {tx.monthsUnpaid}: {d.unpaid.map((m) => monthLabel(m, r.lang)).join(", ")}</p>
        </>)}
      </div>
      <div className="stats">
        <div className="stat"><div className="label">💰 {tx.balance} ({tx.building.toLowerCase()})</div>
          <div className={`value ${sum.balanceCents < 0 ? "bad" : ""}`}>{formatMoney(sum.balanceCents, b.currency)}</div></div>
        <div className="stat"><div className="label">✅ {tx.paidThisMonth}</div><div className="value">{sum.paidThisMonth} / {sum.apartments}</div></div>
      </div>
      <div className="actions">
        <Link className="btn" href="/me/payments">💶 {tx.myPayments}</Link>
        <Link className="btn light" href={`/building/${r.buildingId}`}>🧾 {tx.buildingExpenses}</Link>
      </div>
    </Shell>
  );
}
