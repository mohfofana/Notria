import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { ProfAdaGuide } from "@/components/prof-ada-guide";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Notria - IA educative BEPC",
  description:
    "Plateforme de tutorat IA contextualisee pour les eleves ivoiriens preparant le BEPC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${manrope.variable} ${spaceGrotesk.variable}`}>
        <Providers>
          {children}
          <ProfAdaGuide />
        </Providers>
      </body>
    </html>
  );
}
