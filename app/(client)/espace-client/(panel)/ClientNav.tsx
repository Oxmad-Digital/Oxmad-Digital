"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, FolderOpen, LayoutDashboard, MessagesSquare } from "lucide-react";

export default function ClientNav({ replies }: { replies: number }) {
  const pathname = usePathname();
  const items = [
    { href: "/espace-client", label: "Accueil", count: 0, icon: LayoutDashboard },
    { href: "/espace-client/demandes", label: "Demandes", count: replies, icon: MessagesSquare },
    { href: "/espace-client/documents", label: "Devis & factures", count: 0, icon: FileText },
    { href: "/espace-client/drive", label: "Drive", count: 0, icon: FolderOpen },
  ];
  const current = (href: string) => (href === "/espace-client" ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="adm-nav" aria-label="Espace client">
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
