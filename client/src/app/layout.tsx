import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Notria - Tutorat IA pour le BAC/BEPC",
  description: "Plateforme de tutorat IA pour les élèves ivoiriens préparant le BAC et le BEPC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
