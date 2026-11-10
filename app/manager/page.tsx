import Link from "next/link";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { query } from "@/lib/db";
import { t } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/phone";
import { Flash, Shell } from "../shell";
import { createBuilding } from "./actions";

export default async function ManagerHome({ searchParams }: { searchParams: Promise<{ err?: string; all?: string }> }) {
  const m = await requireManager();
  const tx = t(m.lang);
  const q = await searchParams;
  const buildings = await query<{ id: string; name: string; country: string; apartments: number }>(
    `SELECT b.id, b.name, b.country, count(a.id)::int AS apartments
     FROM buildings b LEFT JOIN apartments a ON a.building_id = b.id
     WHERE b.manager_id = $1 GROUP BY b.id ORDER BY b.name`, [m.id]);
  // Most managers have one building: go straight to its dashboard.
  if (buildings.length === 1 && !q.all && !q.err) redirect(`/manager/buildings/${buildings[0].id}`);
  return (
    <Shell user={m} menu={[{ href: "/manager?all=1", label: tx.buildings, icon: "🏢" }]} active="/manager?all=1" title={tx.buildings}
      buildings={buildings.map((b) => ({ id: b.id, name: b.name, current: false }))}>
      <Flash err={q.err ? tx.errInvalid : null} />
      <div className="stats">
        {buildings.map((b) => (
          <Link key={b.id} href={`/manager/buildings/${b.id}`} className="stat" style={{ color: "inherit" }}>
            <div className="label">{COUNTRIES[b.country as keyof typeof COUNTRIES].name}</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: 4 }}>🏢 {b.name}</div>
            <div className="muted small">{b.apartments} {tx.apartments.toLowerCase()}</div>
          </Link>
        ))}
      </div>
      <form action={createBuilding} className="card">
        <h2>+ {tx.newBuilding}</h2>
        <label>{tx.name}</label><input name="name" required placeholder="Entrance 3, Main Street" />
        <div className="row">
          <div><label>{tx.country}</label>
            <select name="country">{Object.entries(COUNTRIES).map(([k, c]) => <option key={k} value={k}>{c.name} ({c.currency})</option>)}</select></div>
          <div><label>{tx.startMonth}</label><input name="start_month" type="month" required /></div>
        </div>
        <div className="form-end"><button type="submit">{tx.create}</button></div>
      </form>
    </Shell>
  );
}
