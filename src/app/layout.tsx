import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedBoard — Hospital Operations",
  description: "Hospital operational visibility and patient record platform for healthcare environments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
