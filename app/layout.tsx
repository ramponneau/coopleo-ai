import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { inter } from './fonts'

export const metadata: Metadata = {
  title: "Coopleo",
  description: "AI relationship advisor for couples",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}