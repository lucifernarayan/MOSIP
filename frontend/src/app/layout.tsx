import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOSIP Mission Control",
  description:
    "Multi-Agent Orbital Sustainability Intelligence Platform dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
