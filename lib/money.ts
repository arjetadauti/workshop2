/** Currencies shown with decimals; MKD and ALL are whole units (SPEC 4.5). */
const DECIMALS: Record<string, number> = { EUR: 2, MKD: 0, ALL: 0 };

/** Parses "10", "10.5", "10,50" into integer cents. Returns null if invalid or negative. */
export function parseAmount(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

export function formatMoney(cents: number | string | bigint, currency: string): string {
  const n = Number(cents);
  const d = DECIMALS[currency] ?? 2;
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n) / 100;
  const body = d === 0
    ? Math.round(abs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    : abs.toFixed(d);
  return `${sign}${body} ${currency}`;
}
