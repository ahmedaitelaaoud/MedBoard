import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedBoard - Operations hospitalieres",
  description: "Plateforme de visibilite operationnelle hospitaliere et de dossier patient pour les environnements de soins.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
