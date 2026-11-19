import type { Metadata } from "next";

import { PageTransition } from "@/components/page-transition";
import { getAboutContent } from "@/lib/about";

import { AboutContent } from "./about-content";

export const metadata: Metadata = {
  title: "About — PHM Weddings",
  description: "Modern, authentic wedding photography. Based in Ljubljana, available across Europe.",
};

export const instant = false;

export default async function AboutPage() {
  const content = await getAboutContent();

  return (
    <PageTransition pageKey="about">
      <AboutContent {...content} />
    </PageTransition>
  );
}
