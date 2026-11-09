/** Normalizes a phone number to E.164 (+ and 8–15 digits). Returns null if invalid. */
export function normalizePhone(raw: string, defaultCode = "+383"): string | null {
  let p = raw.replace(/[\s\-().]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  if (!p.startsWith("+")) p = defaultCode + p.replace(/^0/, "");
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
}

export const COUNTRIES = {
  XK: { name: "Kosovo", phone: "+383", currency: "EUR", lang: "sq" },
  MK: { name: "North Macedonia", phone: "+389", currency: "MKD", lang: "sq" },
  AL: { name: "Albania", phone: "+355", currency: "ALL", lang: "sq" },
} as const;
export type Country = keyof typeof COUNTRIES;

/** "+38344123456" -> "+383 44 *** 456" style masking for screens. */
export function maskPhone(p: string): string {
  return p.length < 8 ? p : `${p.slice(0, p.length - 6)}***${p.slice(-3)}`;
}
