import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shopify CRO Opportunity Engine",
  description: "Analyze Shopify stores and identify CRO opportunities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
