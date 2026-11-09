import { t } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/phone";
import { requestCodeAction } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  const tx = t("sq");
  return (
    <>
      <h1>{tx.appName}</h1>
      <form action={requestCodeAction} className="card">
        <h2>{tx.login}</h2>
        {err === "phone" && <p className="bad">{tx.badPhone}</p>}
        <label htmlFor="phone">{tx.phone}</label>
        <div className="row">
          <select name="cc" aria-label="Country code" style={{ flex: "0 0 110px" }}>
            {Object.values(COUNTRIES).map((c) => <option key={c.phone} value={c.phone}>{c.phone}</option>)}
          </select>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="44 123 456" />
        </div>
        <button type="submit">{tx.sendCode}</button>
      </form>
    </>
  );
}
