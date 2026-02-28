import type { Metadata } from "next";
import { Manrope, Baloo_2 } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
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
      <body className={`${manrope.variable} ${baloo.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
