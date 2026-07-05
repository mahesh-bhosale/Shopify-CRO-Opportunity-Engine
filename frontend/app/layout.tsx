import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Shopify CRO Opportunity Engine — AI-Powered Store Audit",
  description:
    "Enter any Shopify store URL and get a prioritized, scored CRO audit powered by AI. Identifies conversion friction across PDPs, collections, cart, and more.",
  keywords: [
    "Shopify",
    "CRO",
    "conversion rate optimization",
    "audit",
    "A/B testing",
    "ecommerce",
  ],
  openGraph: {
    title: "Shopify CRO Opportunity Engine",
    description:
      "AI-powered CRO audits for Shopify stores. Identify conversion opportunities, prioritize by ICE score, and generate experiment briefs.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
