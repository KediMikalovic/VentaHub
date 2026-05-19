import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VentaHub | KOBİ E-Ticaret Asistanı",
  description: "VentaHub ile e-ticaret operasyonlarınızı tek bir yerden yönetin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
