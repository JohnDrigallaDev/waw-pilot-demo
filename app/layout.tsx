import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WAW Pilot",
  description: "Browserbasierte Software für Nutzfahrzeughandel.",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="de" suppressHydrationWarning>
      <body className={`${montserrat.variable} antialiased`}>
      {children}
      </body>
      </html>
  );
}