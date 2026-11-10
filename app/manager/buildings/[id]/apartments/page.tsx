import { query } from "@/lib/db";
import { managerContext } from "@/lib/manager-page";
import { addApartment } from "../../../actions";
import { Flash, managerMenu, Shell } from "../../../../shell";

export default async function Apartments({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { m, b, tx, buildings } = await managerContext((await params).id);
  const q = await searchParams;
  const rows = await query<{ id: string; number: string; floor: number; residents: string | null }>(
    `SELECT a.id, a.number, a.floor, string_agg(r.first_name || ' ' || r.last_name, ', ') AS residents
     FROM apartments a LEFT JOIN residents r ON r.apartment_id = a.id AND r.removed_at IS NULL
     WHERE a.building_id = $1 GROUP BY a.id ORDER BY a.floor, a.number`, [b.id]);
  return (
    <Shell user={m} menu={managerMenu(b.id, tx)} active={`/manager/buildings/${b.id}/apartments`} title={tx.apartmentsMenu} subtitle={b.name} buildings={buildings}>
      <Flash ok={q.ok ? tx.saved : null} err={q.err === "duplicate" ? tx.errDuplicate : q.err ? tx.errInvalid : null} />
      <div className="card">
        {rows.length === 0 ? <p className="empty">{tx.emptyApartments}</p> : (
          <table><thead><tr><th>{tx.number}</th><th>{tx.floor}</th><th>{tx.residentsMenu}</th></tr></thead>
            <tbody>{rows.map((a) => <tr key={a.id}><td><strong>{a.number}</strong></td><td>{a.floor}</td><td className="muted">{a.residents ?? "—"}</td></tr>)}</tbody></table>
        )}
      </div>
      <form action={addApartment} className="card">
        <h2>+ {tx.addApartment}</h2>
        <input type="hidden" name="building_id" value={b.id} />
        <div className="row">
          <div><label>{tx.number}</label><input name="number" required placeholder="5" /></div>
          <div><label>{tx.floor}</label><input name="floor" type="number" min={0} defaultValue={0} required /></div>
        </div>
        <div className="form-end"><button type="submit">{tx.addApartment}</button></div>
      </form>
    </Shell>
  );
}
