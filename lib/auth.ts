// Next.js glue: session cookie handling and page guards.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_DAYS, userForToken, type User } from "./auth-core";

export const COOKIE = "session";

export async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: SESSION_DAYS * 24 * 3600,
  });
}

export async function currentUser(): Promise<User | null> {
  return userForToken((await cookies()).get(COOKIE)?.value);
}

export async function requireManager() {
  const u = await currentUser();
  if (!u || u.kind !== "manager") redirect("/login");
  return u;
}

export async function requireResident() {
  const u = await currentUser();
  if (!u || u.kind !== "resident") redirect("/login");
  return u;
}
