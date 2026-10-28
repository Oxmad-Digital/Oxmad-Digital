"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChartNoAxesCombined, Gamepad2, Mail, MessagesSquare, Settings, Users } from "lucide-react";

export default function AdminNav({ unread, pending, requests, signups }: { unread: number; pending: number; requests: number; signups: number }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Statistiques", count: 0, icon: ChartNoAxesCombined },
    { href: "/admin/rendez-vous", label: "Rendez-vous", count: pending, icon: CalendarDays },
    { href: "/admin/demandes", label: "Demandes", count: requests, icon: MessagesSquare },
    { href: "/admin/clients", label: "Clients", count: signups, icon: Users },
    { href: "/admin/messages", label: "Messages", count: unread, icon: Mail },
    { href: "/admin/jeu", label: "Mini-jeu", count: 0, icon: Gamepad2 },
    { href: "/admin/comptes", label: "Comptes", count: 0, icon: Settings },
  ];
  const current = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="adm-nav" aria-label="Admin">
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-current={current(item.href) ? "page" : undefined}>
          <item.icon size={18} strokeWidth={1.7} aria-hidden="true" />
          <span>{item.label}</span>
          {item.count > 0 && <span className="adm-badge">{item.count}</span>}
        </Link>
      ))}
    </nav>
  );
}
