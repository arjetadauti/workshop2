import Link from "next/link";
import { logoutAction } from "./login/actions";
import { t } from "@/lib/i18n";
import type { User } from "@/lib/auth-core";

export function Nav({ user, links }: { user: User; links: { href: string; label: string }[] }) {
  const tx = t(user.lang);
  return (
    <nav>
      {links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
      <span className="muted" style={{ marginLeft: "auto" }}>{user.firstName} {user.lastName}</span>
      <form action={logoutAction}><button type="submit" style={{ margin: 0, padding: "2px 10px" }}>{tx.logout}</button></form>
    </nav>
  );
}
