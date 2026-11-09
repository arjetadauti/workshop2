import { requireManager } from "@/lib/auth";
import { managedBuilding } from "@/lib/buildings";
import { query } from "@/lib/db";
import { t, type Texts } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { monthLabel } from "@/lib/months";
import { Nav } from "../../../nav";
import { addApartment, addService, inviteResident, setPrice } from "../../actions";

type Search = { ok?: string; err?: string };

function Flash({ q, tx }: { q: Search; tx: Texts }) {
  const ok = { saved: tx.saved, invited: tx.invited }[q.ok ?? ""];
  const err = { invalid: tx.errInvalid, duplicate: tx.errDuplicate, phone: tx.errPhoneTaken }[q.err ?? ""];
  return ok ? <p className="msg ok">{ok}</p> : err ? <p className="msg bad">{err}</p> : null;
}

export default async function BuildingSetup({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<Search>;
}) {
  const m = await requireManager();
  const b = await managedBuilding(m.id, (await params).id);
  const tx = t(m.lang);
  const q = await searchParams;

  const apartments = await query<{ id: string; number: string; floor: number }>(
    "SELECT id, number, floor FROM apartments WHERE building_id = $1 ORDER BY floor, number", [b.id]);
  const services = await query<{ id: string; name: string }>(
    "SELECT id, name FROM services WHERE building_id = $1 ORDER BY name", [b.id]);
  const prices = await query<{ service_id: string; floor: number; amount_cents: string; valid_from: string }>(
    `SELECT p.service_id, p.floor, p.amount_cents, to_char(p.valid_from, 'YYYY-MM-DD') AS valid_from
     FROM prices p JOIN services s ON s.id = p.service_id WHERE s.building_id = $1
     ORDER BY p.valid_from`, [b.id]);
  const residents = await query<{ first_name: string; last_name: string; phone: string; number: string; language: string }>(
    `SELECT r.first_name, r.last_name, r.phone, a.number, r.language FROM residents r
     JOIN apartments a ON a.id = r.apartment_id WHERE a.building_id = $1 AND r.removed_at IS NULL
     ORDER BY a.floor, a.number`, [b.id]);
  const floors = [...new Set(apartments.map((a) => a.floor))].sort((x, y) => x - y);
  // latest price per service+floor (prices are ordered by valid_from)
  const current = new Map<string, { amount: string; from: string }>();
  for (const p of prices) current.set(`${p.service_id}:${p.floor}`, { amount: p.amount_cents, from: p.valid_from });

  const hidden = <input type="hidden" name="building_id" value={b.id} />;
  return (
    <>
      <Nav user={m} links={[{ href: "/manager", label: tx.buildings }, { href: `/manager/buildings/${b.id}`, label: b.name }]} />
      <h1>{b.name}</h1>
      <p className="muted">{b.currency} · {tx.startMonth}: {monthLabel(b.start_month, m.lang)}</p>
      <Flash q={q} tx={tx} />

      <h2>{tx.apartments}</h2>
      <div className="card">
        {apartments.length === 0 ? <p className="muted">{tx.noneYet}</p> : (
          <table><thead><tr><th>{tx.number}</th><th>{tx.floor}</th></tr></thead>
            <tbody>{apartments.map((a) => <tr key={a.id}><td>{a.number}</td><td>{a.floor}</td></tr>)}</tbody></table>
        )}
        <form action={addApartment} className="row">
          {hidden}
          <div><label>{tx.number}</label><input name="number" required /></div>
          <div><label>{tx.floor}</label><input name="floor" type="number" min={0} defaultValue={0} required /></div>
          <div style={{ alignSelf: "end" }}><button type="submit">{tx.addApartment}</button></div>
        </form>
      </div>

      <h2>{tx.services} · {tx.prices}</h2>
      <div className="card scroll">
        {services.length > 0 && floors.length > 0 && (
          <table>
            <thead><tr><th>{tx.service}</th>{floors.map((f) => <th key={f} className="num">{tx.floorShort} {f}</th>)}</tr></thead>
            <tbody>{services.map((s) => (
              <tr key={s.id}><td>{s.name}</td>{floors.map((f) => {
                const p = current.get(`${s.id}:${f}`);
                return <td key={f} className="num">{p ? formatMoney(p.amount, b.currency) : <span className="bad">—</span>}</td>;
              })}</tr>))}</tbody>
          </table>
        )}
        <form action={addService} className="row">
          {hidden}
          <div><label>{tx.service}</label><input name="name" required placeholder="Ashensori" /></div>
          <div style={{ alignSelf: "end" }}><button type="submit">{tx.addService}</button></div>
        </form>
        {services.length > 0 && (
          <form action={setPrice} className="row">
            {hidden}
            <div><label>{tx.service}</label><select name="service_id">{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label>{tx.floor}</label><input name="floor" type="number" min={0} defaultValue={0} required /></div>
            <div><label>{tx.amount} ({b.currency})</label><input name="amount" inputMode="decimal" required placeholder="0" /></div>
            <div><label>{tx.validFrom}</label><input name="valid_from" type="month" defaultValue={b.start_month.slice(0, 7)} /></div>
            <div style={{ alignSelf: "end" }}><button type="submit">{tx.setPrice}</button></div>
          </form>
        )}
      </div>

      <h2>{tx.residents}</h2>
      <div className="card">
        {residents.length === 0 ? <p className="muted">{tx.noneYet}</p> : (
          <table><thead><tr><th>{tx.apartment}</th><th>{tx.name}</th><th>{tx.phone}</th></tr></thead>
            <tbody>{residents.map((r) => <tr key={r.phone}><td>{r.number}</td><td>{r.first_name} {r.last_name}</td><td>{r.phone}</td></tr>)}</tbody></table>
        )}
        {apartments.length > 0 && (
          <form action={inviteResident}>
            {hidden}
            <div className="row">
              <div><label>{tx.firstName}</label><input name="first_name" required /></div>
              <div><label>{tx.lastName}</label><input name="last_name" required /></div>
            </div>
            <div className="row">
              <div><label>{tx.phone}</label><input name="phone" type="tel" required /></div>
              <div><label>{tx.apartment}</label><select name="apartment_id">{apartments.map((a) => <option key={a.id} value={a.id}>{a.number} ({tx.floorShort} {a.floor})</option>)}</select></div>
              <div><label>{tx.language}</label><select name="language"><option value="sq">Shqip</option><option value="mk">Македонски</option><option value="en">English</option></select></div>
            </div>
            <button type="submit">{tx.invite}</button>
          </form>
        )}
      </div>
    </>
  );
}
