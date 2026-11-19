import Image from "next/image";

import type { AboutPortrait } from "@/content/about";

import styles from "./about.module.css";

export function AboutContent({ biography, portrait }: { biography: string; portrait?: AboutPortrait }) {
  const paragraphs = biography.split(/\r?\n(?:[^\S\r\n]*\r?\n)+/);

  return (
    <main id="about-top" className={styles.page}>
      <header className={styles.intro}>
        <h1>Hi, I’m Pia.</h1>
        <p>I&apos;m so glad you&apos;re here.</p>
      </header>

      {portrait && (
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
      )}

      <div className={styles.copy}>
        {paragraphs.map((paragraph, index) => <p key={index}>{paragraph.trim()}</p>)}
      </div>
    </main>
  );
}
