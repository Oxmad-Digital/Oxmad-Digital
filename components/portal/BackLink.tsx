import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** "Back to the parent page" link at the top of a page, with the chevron used across the client area. */
export default function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="adm-link adm-back-link">
      <ChevronLeft size={15} strokeWidth={1.8} aria-hidden="true" />
      {children}
    </Link>
  );
}
