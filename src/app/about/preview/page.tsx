import type { Metadata } from "next";

import { getSanityImagePath } from "@/lib/sanity";

import { AboutDraftPreview } from "./about-draft-preview";

export const metadata: Metadata = {
  title: "About draft preview — PHM Weddings",
  robots: { index: false, follow: false },
};

export default function AboutPreviewPage() {
  return <AboutDraftPreview imagePath={getSanityImagePath()} />;
}
