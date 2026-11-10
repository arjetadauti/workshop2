import { query } from "@/lib/db";
import { managerContext } from "@/lib/manager-page";
import { inviteResident } from "../../../actions";
import { Flash, managerMenu, Shell } from "../../../../shell";

export default async function Residents({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { m, b, tx, buildings } = await managerContext((await params).id);
  const q = await searchParams;
  const apartments = await query<{ id: string; number: string; floor: number }>(
    "SELECT id, number, floor FROM apartments WHERE building_id = $1 ORDER BY floor, number", [b.id]);
  const residents = await query<{ id: string; first_name: string; last_name: string; phone: string; number: string; language: string }>(
    `SELECT r.id, r.first_name, r.last_name, r.phone, a.number, r.language FROM residents r
     JOIN apartments a ON a.id = r.apartment_id WHERE a.building_id = $1 AND r.removed_at IS NULL ORDER BY a.floor, a.number`, [b.id]);
  const err = { invalid: tx.errInvalid, phone: tx.errPhoneTaken }[q.err ?? ""];
  return (
    <Shell user={m} menu={managerMenu(b.id, tx)} active={`/manager/buildings/${b.id}/residents`} title={tx.residentsMenu} subtitle={b.name} buildings={buildings}>
      <Flash ok={q.ok ? tx.invited : null} err={err} />
      <div className="card">
        {residents.length === 0 ? <p className="empty">{tx.emptyResidents}</p> : (
          <table><thead><tr><th>{tx.apartment}</th><th>{tx.name}</th><th>{tx.phone}</th><th>{tx.language}</th></tr></thead>
            <tbody>{residents.map((r) => <tr key={r.id}><td><strong>{r.number}</strong></td><td>{r.first_name} {r.last_name}</td><td>{r.phone}</td><td>{r.language.toUpperCase()}</td></tr>)}</tbody></table>
        )}
      </div>
      {apartments.length === 0 ? <p className="msg bad">{tx.needApartments}</p> : (
        <form action={inviteResident} className="card">
          <h2>+ {tx.invite}</h2>
          <input type="hidden" name="building_id" value={b.id} />
          <div className="row">
            <div><label>{tx.firstName}</label><input name="first_name" required /></div>
            <div><label>{tx.lastName}</label><input name="last_name" required /></div>
          </div>
          <div className="row">
            <div><label>{tx.phone}</label><input name="phone" type="tel" required placeholder="44 123 456" /></div>
            <div><label>{tx.apartment}</label><select name="apartment_id">{apartments.map((a) => <option key={a.id} value={a.id}>{a.number} ({tx.floorShort} {a.floor})</option>)}</select></div>
            <div><label>{tx.language}</label><select name="language"><option value="en">English</option><option value="sq">Shqip</option><option value="mk">Македонски</option></select></div>
          </div>
          <div className="form-end"><button type="submit">📩 {tx.invite}</button></div>
        </form>
      )}
    </Shell>
  );
}
