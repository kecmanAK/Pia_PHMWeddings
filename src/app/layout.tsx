import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { Suspense } from "react";

import { ContactFooter } from "@/components/contact-footer";
import { ContactLinks, PublishedContactLinks } from "@/components/contact-links";
import { MotionProvider } from "@/components/motion-provider";
import { SiteContactBar } from "@/components/site-contact-bar";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const archivo = Archivo({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: "variable",
});

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
  weight: "variable",
});

export const metadata: Metadata = {
  title: "PHM Weddings — Soft, elegant, authentic photography",
  description:
    "PHM Weddings documents celebrations with modern, authentic wedding photography across Europe and worldwide.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <body>
        <MotionProvider>
          <SiteHeader />
          {children}
          <ContactFooter />
          <SiteContactBar>
            <Suspense fallback={<ContactLinks inBar />}>
              <PublishedContactLinks inBar />
            </Suspense>
          </SiteContactBar>
        </MotionProvider>
      </body>
    </html>
  );
}
