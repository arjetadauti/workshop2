import { t } from "@/lib/i18n";
import { maskPhone } from "@/lib/phone";
import { requestCodeAction, verifyCodeAction } from "../actions";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ phone?: string; err?: string }> }) {
  const { phone = "", err } = await searchParams;
  const tx = t("sq");
  return (
    <>
      <h1>{tx.appName}</h1>
      <div className="card">
        <p className="msg">{tx.codeSent}</p>
        {err === "code" && <p className="bad">{tx.badCode}</p>}
        <form action={verifyCodeAction}>
          <input type="hidden" name="phone" value={phone} />
          <label htmlFor="code">{tx.enterCode} {maskPhone(phone)}</label>
          <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required />
          <button type="submit">{tx.login}</button>
        </form>
        <form action={requestCodeAction}>
          <input type="hidden" name="phone" value={phone} />
          <button type="submit" style={{ background: "transparent", color: "var(--accent)", padding: 0 }}>{tx.resend}</button>
        </form>
      </div>
    </>
  );
}
