import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { buildingById } from "@/lib/buildings";
import { buildingSummary, canSeeBuilding } from "@/lib/expenses";
import { t } from "@/lib/i18n";
import { BalanceStats, ExpenseList } from "../../expense-list";
import { residentMenu, Shell } from "../../shell";

// Residents' view of the building: totals and expenses only, never names or apartments (SPEC 7.3).
export default async function BuildingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const tx = t(user.lang);
  if (!(await canSeeBuilding(user, id))) return <div className="center"><div className="card"><h1>403</h1><p className="bad">{tx.noAccess}</p></div></div>;
  if (user.kind === "manager") redirect(`/manager/buildings/${id}/expenses`);
  const b = (await buildingById(id))!;
  const sum = await buildingSummary(id);
  return (
    <Shell user={user} menu={residentMenu(id, tx)} active={`/building/${id}`} title={tx.buildingExpenses} subtitle={b.name}>
      <BalanceStats sum={sum} currency={b.currency} tx={tx} />
      <div className="card"><h2>{tx.whereMoneyWent}</h2><ExpenseList sum={sum} buildingId={id} currency={b.currency} tx={tx} /></div>
    </Shell>
  );
}
