import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookCallProvider } from "@/components/BookCall/BookCallContext";
import { LanguageProvider } from "@/components/Language/LanguageContext";

export const metadata: Metadata = {
  title: "Oxmad Digital – Agence web Antananarivo",
  description: "Oxmad Digital conçoit des sites vitrines, e-commerce et stratégies SEO modernes et performants pour les entreprises de Madagascar.",
  keywords: "agence web Madagascar, création site internet Antananarivo, e-commerce Madagascar, SEO Madagascar",
  icons: {
    icon: "/favicon.svg",
  },
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
        <LanguageProvider>
          <BookCallProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </BookCallProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
