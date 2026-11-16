import type { Metadata } from "next";

import { PageTransition } from "@/components/page-transition";
import { WorkPortfolio } from "@/components/work-portfolio";
import { getWorkWeddings } from "@/lib/wedding-content";

import styles from "./work.module.css";

export const instant = false;

export const metadata: Metadata = {
  title: "Work — PHM Weddings",
  description: "Explore wedding photography by PHM Weddings.",
};

export default async function WorkPage() {
  const weddings = await getWorkWeddings();

  return (
    <PageTransition pageKey="work">
      <main id="top" className={styles.page}>
        <h1 className="sr-only">Selected wedding photography</h1>
        <WorkPortfolio weddings={weddings} />
      </main>
    </PageTransition>
  );
}
