// Login logic (SPEC 4.4), independent of Next.js so it can be tested directly.
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { query } from "./db";
import { sendSms, smsText, type Lang } from "./sms";

export const CODE_TTL_MIN = 5;
export const MAX_ATTEMPTS = 5;
export const RESEND_AFTER_SEC = 60;
export const MAX_SMS_PER_15_MIN = 3;
export const SESSION_DAYS = 90;

export type User =
  | { kind: "manager"; id: string; firstName: string; lastName: string; phone: string; lang: Lang }
  | {
      kind: "resident"; id: string; firstName: string; lastName: string; phone: string; lang: Lang;
      apartmentId: string; apartmentNumber: string; floor: number; buildingId: string;
    };

const secret = () => process.env.AUTH_SECRET ?? "dev-only-secret-change-me";
const hashCode = (phone: string, code: string) => createHmac("sha256", secret()).update(`${phone}:${code}`).digest("hex");
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

async function findByPhone(phone: string): Promise<{ kind: "manager" | "resident"; id: string; lang: Lang } | null> {
  const m = await query<{ id: string; language: Lang }>("SELECT id, language FROM managers WHERE phone = $1", [phone]);
  if (m[0]) return { kind: "manager", id: m[0].id, lang: m[0].language };
  const r = await query<{ id: string; language: Lang }>(
    "SELECT id, language FROM residents WHERE phone = $1 AND removed_at IS NULL", [phone]);
  return r[0] ? { kind: "resident", id: r[0].id, lang: r[0].language } : null;
}

/**
 * Sends a login code if the number is registered and limits allow it.
 * Always resolves the same way for the caller, so unknown numbers can't be detected.
 * Returns the internal outcome only for tests and logs.
 */
export async function requestCode(phone: string): Promise<"sent" | "unknown" | "too_soon" | "rate_limited"> {
  const user = await findByPhone(phone);
  if (!user) return "unknown";
  const [recent] = await query<{ last: Date | null; n: number }>(
    `SELECT max(created_at) AS last, count(*)::int AS n FROM login_codes
     WHERE phone = $1 AND created_at > now() - interval '15 minutes'`, [phone]);
  if (recent.last && Date.now() - new Date(recent.last).getTime() < RESEND_AFTER_SEC * 1000) return "too_soon";
  if (recent.n >= MAX_SMS_PER_15_MIN) return "rate_limited";
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await query(
    `INSERT INTO login_codes (phone, code_hash, expires_at) VALUES ($1, $2, now() + interval '${CODE_TTL_MIN} minutes')`,
    [phone, hashCode(phone, code)]);
  await sendSms(phone, smsText.loginCode(user.lang, code));
  return "sent";
}

/** Checks a code. On success returns a new session token (to put in a cookie). */
export async function verifyCode(phone: string, code: string): Promise<string | null> {
  // Count the attempt first, atomically, so 5 wrong tries lock the code even under parallel requests.
  const [row] = await query<{ id: string; code_hash: string }>(
    `UPDATE login_codes SET attempts = attempts + 1
     WHERE id = (SELECT id FROM login_codes WHERE phone = $1 AND used_at IS NULL AND expires_at > now()
                 ORDER BY created_at DESC LIMIT 1)
       AND attempts < ${MAX_ATTEMPTS}
     RETURNING id, code_hash`, [phone]);
  if (!row || !/^\d{6}$/.test(code)) return null;
  const a = Buffer.from(row.code_hash, "hex"), b = Buffer.from(hashCode(phone, code), "hex");
  if (!timingSafeEqual(a, b)) return null;
  const used = await query("UPDATE login_codes SET used_at = now() WHERE id = $1 AND used_at IS NULL RETURNING id", [row.id]);
  if (used.length === 0) return null;
  const user = await findByPhone(phone);
  if (!user) return null;
  const token = randomBytes(32).toString("base64url");
  await query(
    `INSERT INTO sessions (token_hash, user_kind, user_id, expires_at)
     VALUES ($1, $2, $3, now() + interval '${SESSION_DAYS} days')`, [hashToken(token), user.kind, user.id]);
  return token;
}

export async function userForToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const [s] = await query<{ user_kind: string; user_id: string }>(
    "SELECT user_kind, user_id FROM sessions WHERE token_hash = $1 AND expires_at > now()", [hashToken(token)]);
  if (!s) return null;
  if (s.user_kind === "manager") {
    const [m] = await query<{ id: string; first_name: string; last_name: string; phone: string; language: Lang }>(
      "SELECT id, first_name, last_name, phone, language FROM managers WHERE id = $1", [s.user_id]);
    return m ? { kind: "manager", id: m.id, firstName: m.first_name, lastName: m.last_name, phone: m.phone, lang: m.language } : null;
  }
  const [r] = await query<{
    id: string; first_name: string; last_name: string; phone: string; language: Lang;
    apartment_id: string; number: string; floor: number; building_id: string;
  }>(
    `SELECT r.id, r.first_name, r.last_name, r.phone, r.language, r.apartment_id, a.number, a.floor, a.building_id
     FROM residents r JOIN apartments a ON a.id = r.apartment_id
     WHERE r.id = $1 AND r.removed_at IS NULL`, [s.user_id]);
  return r ? {
    kind: "resident", id: r.id, firstName: r.first_name, lastName: r.last_name, phone: r.phone, lang: r.language,
    apartmentId: r.apartment_id, apartmentNumber: r.number, floor: r.floor, buildingId: r.building_id,
  } : null;
}

export async function endSession(token: string) {
  await query("UPDATE sessions SET expires_at = now() WHERE token_hash = $1", [hashToken(token)]);
}
