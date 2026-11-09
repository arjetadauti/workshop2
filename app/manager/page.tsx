import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { query } from "@/lib/db";
import { t } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/phone";
import { Nav } from "../nav";
import { createBuilding } from "./actions";

export default async function ManagerHome({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const m = await requireManager();
  const tx = t(m.lang);
  const { err } = await searchParams;
  const buildings = await query<{ id: string; name: string; country: string; apartments: number }>(
    `SELECT b.id, b.name, b.country, count(a.id)::int AS apartments
     FROM buildings b LEFT JOIN apartments a ON a.building_id = b.id
     WHERE b.manager_id = $1 GROUP BY b.id ORDER BY b.name`, [m.id]);
  return (
    <>
      <Nav user={m} links={[{ href: "/manager", label: tx.buildings }]} />
      <h1>{tx.buildings}</h1>
      {buildings.length === 0 && <p className="muted">{tx.noneYet}</p>}
      {buildings.map((b) => (
        <div className="card" key={b.id}>
          <Link href={`/manager/buildings/${b.id}`}><strong>{b.name}</strong></Link>
          <div className="muted">{COUNTRIES[b.country as keyof typeof COUNTRIES].name} · {b.apartments} {tx.apartments.toLowerCase()}</div>
        </div>
      ))}
      <form action={createBuilding} className="card">
        <h2>{tx.newBuilding}</h2>
        {err && <p className="bad">{tx.errInvalid}</p>}
        <label>{tx.name}</label><input name="name" required />
        <div className="row">
          <div><label>{tx.country}</label>
            <select name="country">{Object.entries(COUNTRIES).map(([k, c]) => <option key={k} value={k}>{c.name} ({c.currency})</option>)}</select></div>
          <div><label>{tx.startMonth}</label><input name="start_month" type="month" required /></div>
        </div>
        <button type="submit">{tx.create}</button>
      </form>
    </>
  );
}
