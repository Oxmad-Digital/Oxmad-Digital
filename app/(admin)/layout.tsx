import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./admin.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: "Admin — Oxmad Digital",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#11120e",
};

/** Separate root layout: the admin skips the site chrome (header, cursor, smooth scroll, tracking). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={geist.variable}>
      <body className="adm">{children}</body>
    </html>
  );
}
