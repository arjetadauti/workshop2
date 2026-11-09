import { requireResident } from "@/lib/auth";
import { buildingById } from "@/lib/buildings";
import { t } from "@/lib/i18n";
import { Nav } from "../nav";

export default async function MePage() {
  const r = await requireResident();
  const tx = t(r.lang);
  const b = await buildingById(r.buildingId);
  return (
    <>
      <Nav user={r} links={[{ href: "/me", label: tx.myApartment }]} />
      <h1>{tx.welcome}, {r.firstName}</h1>
      <div className="card">
        <div>{tx.building}: <strong>{b?.name}</strong></div>
        <div>{tx.apartment}: <strong>{r.apartmentNumber}</strong> · {tx.floorShort} {r.floor}</div>
      </div>
    </>
  );
}
