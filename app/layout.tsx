import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500"],
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-heading-family",
  weight: ["200", "300", "400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UI/UX Mock Generator",
  description:
    "Generate high quality free UI/UX mobile and web mockup designs with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geist.variable} ${inter.className}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
