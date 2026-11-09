import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function Home() {
  const u = await currentUser();
  redirect(!u ? "/login" : u.kind === "manager" ? "/manager" : "/me");
}
