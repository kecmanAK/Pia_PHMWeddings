import type { Metadata } from "next";
import Image from "next/image";

import { PageTransition } from "@/components/page-transition";
import { getAboutContent } from "@/lib/about";

import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About — PHM Weddings",
  description: "Modern, authentic wedding photography. Based in Ljubljana, available across Europe.",
};

export const instant = false;

export default async function AboutPage() {
  const { biography, portrait } = await getAboutContent();
  const paragraphs = biography.split(/\r?\n(?:[^\S\r\n]*\r?\n)+/);

  return (
    <PageTransition pageKey="about">
      <main id="top" className={styles.page}>
        <header className={styles.intro}>
          <h1>Hi, I’m Pia.</h1>
          <p>I&apos;m so glad you&apos;re here.</p>
        </header>

        <div className={styles.portraitFrame}>
          <Image
            className={styles.portrait}
            src={portrait.src}
            alt={portrait.alt}
            width={portrait.width}
            height={portrait.height}
            sizes="(max-width: 768px) calc(100vw - 2rem), 42vw"
            loading="eager"
          />
        </div>

        <div className={styles.copy}>
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph.trim()}</p>)}
        </div>
      </main>
    </PageTransition>
  );
}
