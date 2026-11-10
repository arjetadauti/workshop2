import Link from "next/link";
import type { ReactNode } from "react";
import type { User } from "@/lib/auth-core";
import { t, type Texts } from "@/lib/i18n";
import { logoutAction } from "./login/actions";

export type MenuItem = { href: string; label: string; icon: string };

export function managerMenu(buildingId: string, tx: Texts): MenuItem[] {
  const b = `/manager/buildings/${buildingId}`;
  return [
    { href: b, label: tx.dashboard, icon: "🏠" },
    { href: `${b}/payments`, label: tx.paymentsMenu, icon: "💶" },
    { href: `${b}/expenses`, label: tx.expensesMenu, icon: "🧾" },
    { href: `${b}/apartments`, label: tx.apartmentsMenu, icon: "🚪" },
    { href: `${b}/residents`, label: tx.residentsMenu, icon: "👥" },
    { href: `${b}/services`, label: tx.servicesMenu, icon: "🧹" },
  ];
}

export function residentMenu(buildingId: string, tx: Texts): MenuItem[] {
  return [
    { href: "/me", label: tx.home, icon: "🏠" },
    { href: "/me/payments", label: tx.myPayments, icon: "💶" },
    { href: `/building/${buildingId}`, label: tx.buildingExpenses, icon: "🧾" },
  ];
}

/** Page frame: side menu (☰ on phones), title bar and content. */
export function Shell({ user, menu, active, title, subtitle, buildings, children }: {
  user: User; menu: MenuItem[]; active: string; title: string; subtitle?: string;
  buildings?: { id: string; name: string; current: boolean }[]; children: ReactNode;
}) {
  const tx = t(user.lang);
  return (
    <div className="app">
      <input type="checkbox" id="nav" className="nav-toggle" aria-label={tx.menu} />
      <aside className="side">
        <div className="brand">🏢 {tx.appName}</div>
        {buildings && buildings.length > 0 && (
          <div className="switcher">
            {buildings.map((b) => (
              <Link key={b.id} href={`/manager/buildings/${b.id}`} className={b.current ? "current" : ""}>{b.name}</Link>
            ))}
            <Link href="/manager?all=1" className="muted small">+ {tx.allBuildings}</Link>
          </div>
        )}
        <nav className="menu">
          {menu.map((m) => (
            <Link key={m.href} href={m.href} className={m.href === active ? "active" : ""}>
              <span className="ico">{m.icon}</span>{m.label}
            </Link>
          ))}
        </nav>
        <div className="who">
          <div><strong>{user.firstName} {user.lastName}</strong></div>
          <div className="muted small">{user.kind === "manager" ? "Menaxher" : `${tx.apartment} ${user.apartmentNumber}`}</div>
          <form action={logoutAction}><button type="submit" className="ghost">↩ {tx.logout}</button></form>
        </div>
      </aside>
      <label htmlFor="nav" className="scrim" />
      <div className="content">
        <header className="top">
          <label htmlFor="nav" className="burger" aria-label={tx.menu}>☰</label>
          <div>
            <h1>{title}</h1>
            {subtitle && <div className="muted">{subtitle}</div>}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

export function Flash({ ok, err }: { ok?: string | null; err?: string | null }) {
  if (ok) return <p className="msg ok">✓ {ok}</p>;
  if (err) return <p className="msg bad">⚠ {err}</p>;
  return null;
}
