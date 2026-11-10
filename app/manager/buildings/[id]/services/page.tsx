import { query } from "@/lib/db";
import { managerContext } from "@/lib/manager-page";
import { addService, setPrices } from "../../../actions";
import { Flash, managerMenu, Shell } from "../../../../shell";

export default async function Services({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { m, b, tx, buildings } = await managerContext((await params).id);
  const q = await searchParams;
  const services = await query<{ id: string; name: string }>("SELECT id, name FROM services WHERE building_id = $1 ORDER BY name", [b.id]);
  const floors = (await query<{ floor: number }>("SELECT DISTINCT floor FROM apartments WHERE building_id = $1 ORDER BY floor", [b.id])).map((r) => r.floor);
  const prices = await query<{ service_id: string; floor: number; amount_cents: string }>(
    `SELECT DISTINCT ON (p.service_id, p.floor) p.service_id, p.floor, p.amount_cents
     FROM prices p JOIN services s ON s.id = p.service_id WHERE s.building_id = $1
     ORDER BY p.service_id, p.floor, p.valid_from DESC`, [b.id]);
  const price = new Map(prices.map((p) => [`${p.service_id}:${p.floor}`, (Number(p.amount_cents) / 100).toString()]));
  const err = { invalid: tx.errInvalid, duplicate: tx.errDuplicate }[q.err ?? ""];
  return (
    <Shell user={m} menu={managerMenu(b.id, tx)} active={`/manager/buildings/${b.id}/services`} title={tx.servicesMenu} subtitle={b.name} buildings={buildings}>
      <Flash ok={q.ok ? tx.saved : null} err={err} />
      {services.length === 0 ? <div className="card"><p className="empty">{tx.emptyServices}</p></div>
        : floors.length === 0 ? <p className="msg bad">{tx.needApartments}</p> : (
        <form action={setPrices} className="card">
          <h2>💶 {tx.prices} ({b.currency})</h2>
          <p className="muted small">{tx.priceHelp}</p>
          <input type="hidden" name="building_id" value={b.id} />
          <div className="scroll">
            <table>
              <thead><tr><th>{tx.service}</th>{floors.map((f) => <th key={f} className="num">{tx.floorShort} {f}</th>)}</tr></thead>
              <tbody>{services.map((s) => (
                <tr key={s.id}><td><strong>{s.name}</strong></td>{floors.map((f) => (
                  <td key={f} className="num"><input className="price-input" name={`price:${s.id}:${f}`} inputMode="decimal"
                    defaultValue={price.get(`${s.id}:${f}`) ?? ""} placeholder="0" aria-label={`${s.name} ${tx.floorShort} ${f}`} /></td>))}</tr>))}</tbody>
            </table>
          </div>
          <div className="row" style={{ alignItems: "end" }}>
            <div style={{ flex: "0 1 220px" }}><label>{tx.validFrom}</label><input name="valid_from" type="month" defaultValue={b.start_month.slice(0, 7)} /></div>
            <div><button type="submit">💾 {tx.saveAll}</button></div>
          </div>
        </form>
      )}
      <form action={addService} className="card">
        <h2>+ {tx.addService}</h2>
        <input type="hidden" name="building_id" value={b.id} />
        <div className="row" style={{ alignItems: "end" }}>
          <div><label>{tx.service}</label><input name="name" required placeholder="Pastrimi, Ashensori, Drita…" /></div>
          <div style={{ flex: "0 0 auto" }}><button type="submit">{tx.addService}</button></div>
        </div>
      </form>
    </Shell>
  );
}
