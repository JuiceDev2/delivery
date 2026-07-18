import "./globals.css";
import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";

const fuenteDisplay = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});
const fuenteBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Delivery Zona Valles",
  description: "Comida y productos locales, entregados por negocios de tu zona.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fuenteDisplay.variable} ${fuenteBody.variable}`}>
      <body className="min-h-screen bg-piedra font-sans text-agave-osc antialiased">
        {children}
      </body>
    </html>
  );
}
