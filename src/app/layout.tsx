import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WoodFlow SaaS - Gestão para Marcenarias",
  description: "Elimine o caos financeiro da sua marcenaria.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased bg-stone-50 text-stone-900`}>
        {children}
      </body>
    </html>
  );
}
