import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "../(admin)/admin.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: "Espace client — Oxmad Digital",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#11120e",
};

/** Separate root layout, like the admin, whose UI kit (admin.css) it shares. */
export default function ClientRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={geist.variable}>
      <body className="adm">{children}</body>
    </html>
  );
}
