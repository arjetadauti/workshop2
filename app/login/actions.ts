"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { endSession, requestCode, verifyCode } from "@/lib/auth-core";
import { COOKIE, setSessionCookie } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";

export async function requestCodeAction(form: FormData) {
  const phone = normalizePhone(String(form.get("phone") ?? ""), String(form.get("cc") ?? "+383"));
  if (!phone) redirect("/login?err=phone");
  await requestCode(phone); // same response whatever the outcome (SPEC 4.4)
  redirect(`/login/verify?phone=${encodeURIComponent(phone)}`);
}

export async function verifyCodeAction(form: FormData) {
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  const code = String(form.get("code") ?? "").trim();
  const token = phone ? await verifyCode(phone, code) : null;
  if (!token) redirect(`/login/verify?phone=${encodeURIComponent(phone ?? "")}&err=code`);
  await setSessionCookie(token);
  redirect("/");
}

export async function logoutAction() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await endSession(token);
  jar.delete(COOKIE);
  redirect("/login");
}
