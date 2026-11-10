import type { Summary } from "@/lib/expenses";
import type { Texts } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

export function ExpenseList({ sum, buildingId, currency, tx }: { sum: Summary; buildingId: string; currency: string; tx: Texts }) {
  if (sum.expenses.length === 0) return <p className="empty">{tx.emptyExpenses}</p>;
  return (
    <div className="scroll">
      <table>
        <thead><tr><th>{tx.date}</th><th>{tx.description}</th><th>{tx.service}</th><th className="num">{tx.amount}</th><th></th></tr></thead>
        <tbody>{sum.expenses.map((e) => (
          <tr key={e.id}><td>{e.paid_on}</td><td><strong>{e.description}</strong></td><td>{e.service}</td>
            <td className="num">{formatMoney(e.amount_cents, currency)}</td>
            <td><a href={`/building/${buildingId}/invoice/${e.id}`} target="_blank" rel="noreferrer">📄 {tx.openInvoice}</a></td></tr>))}</tbody>
      </table>
    </div>
  );
}

export function BalanceStats({ sum, currency, tx }: { sum: Summary; currency: string; tx: Texts }) {
  return (
    <div className="stats">
      <div className="stat"><div className="label">💰 {tx.balance}</div>
        <div className={`value ${sum.balanceCents < 0 ? "bad" : ""}`}>{formatMoney(sum.balanceCents, currency)}</div></div>
      <div className="stat"><div className="label">⬆ {tx.income}</div><div className="value">{formatMoney(sum.incomeCents, currency)}</div></div>
      <div className="stat"><div className="label">⬇ {tx.expenses}</div><div className="value">{formatMoney(sum.expenseCents, currency)}</div></div>
      <div className="stat"><div className="label">✅ {tx.paidThisMonth}</div><div className="value">{sum.paidThisMonth} / {sum.apartments}</div></div>
    </div>
  );
}
