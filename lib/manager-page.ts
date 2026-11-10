import { requireManager } from "./auth";
import { managedBuilding } from "./buildings";
import { query } from "./db";
import { t } from "./i18n";

/** Everything a manager page needs: the manager, the building (checked), texts and the building switcher. */
export async function managerContext(buildingId: string) {
  const m = await requireManager();
  const b = await managedBuilding(m.id, buildingId);
  const all = await query<{ id: string; name: string }>("SELECT id, name FROM buildings WHERE manager_id = $1 ORDER BY name", [m.id]);
  return { m, b, tx: t(m.lang), buildings: all.map((x) => ({ ...x, current: x.id === b.id })) };
}
