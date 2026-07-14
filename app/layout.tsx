import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery",
  description: "App de delivery de comida",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
