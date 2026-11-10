/** Months are handled as "YYYY-MM-01" strings, matching Postgres DATE columns. */
export function toMonth(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00Z" : "")) : d;
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return toMonth(d);
}

/** Inclusive list of months from `from` to `to`. */
export function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
}

const NAMES: Record<string, string[]> = {
  sq: ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nentor", "Dhjetor"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  mk: ["јануари", "февруари", "март", "април", "мај", "јуни", "јули", "август", "септември", "октомври", "ноември", "декември"],
};

export function monthLabel(month: string, lang = "en"): string {
  const [y, m] = month.split("-").map(Number);
  return `${(NAMES[lang] ?? NAMES.en)[m - 1]} ${y}`;
}

/** "Mars-Maj 2027" style label for a run of months (used in SMS). */
export function monthsLabel(months: string[], lang = "en"): string {
  if (months.length === 1) return monthLabel(months[0], lang);
  const a = monthLabel(months[0], lang), b = monthLabel(months[months.length - 1], lang);
  const [an, ay] = [a.slice(0, a.lastIndexOf(" ")), a.slice(a.lastIndexOf(" ") + 1)];
  return a.endsWith(b.slice(b.lastIndexOf(" "))) ? `${an}-${b}` : `${an} ${ay}-${b}`;
}
