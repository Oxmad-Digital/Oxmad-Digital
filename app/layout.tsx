import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Oxmad Digital – Agence web Antananarivo",
  description: "Oxmad Digital conçoit des sites vitrines, e-commerce et stratégies SEO modernes et performants pour les entreprises de Madagascar.",
  keywords: "agence web Madagascar, création site internet Antananarivo, e-commerce Madagascar, SEO Madagascar",
};

const themeInitScript = `(function(){try{if(localStorage.getItem("ox-theme")==="dark")document.documentElement.classList.add("ox-dark");}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
