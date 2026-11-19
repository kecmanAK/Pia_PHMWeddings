import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageTransition } from "@/components/page-transition";
import { WorkPhoto } from "@/components/work-photo";
import { getGalleryColumns } from "@/lib/work";
import { getWeddingGallery } from "@/lib/wedding-content";

import styles from "./wedding.module.css";

export const instant = false;

type WeddingPageProps = { params: Promise<{ slug: string }> };

async function readWedding(params: WeddingPageProps["params"]) {
  const { slug } = await params;
  const wedding = await getWeddingGallery(slug);
  if (!wedding) notFound();
  if (wedding.slug !== slug) redirect(`/weddings/${wedding.slug}`);
  return wedding;
}

export async function generateMetadata({ params }: WeddingPageProps): Promise<Metadata> {
  const wedding = await readWedding(params);
  return { title: `${wedding.names} — PHM Weddings` };
}

export default async function WeddingPage({ params }: WeddingPageProps) {
  const wedding = await readWedding(params);
  const columns = getGalleryColumns(wedding.photos);

  return (
    <PageTransition pageKey={`wedding-${wedding.slug}`}>
      <main id="top" className={styles.page}>
        <header className={styles.intro}>
          <h1>{wedding.names}</h1>
          {wedding.testimonial && <blockquote>“{wedding.testimonial}”</blockquote>}
          {wedding.venue && <p>at {wedding.venue}</p>}
        </header>
        <div className={styles.photos}>
          {columns.map((column, columnIndex) => (
            <div className={styles.column} key={columnIndex}>
              {column.map((photo, photoIndex) => (
                <figure key={photo.photoId} data-photo-id={photo.photoId}>
                  <WorkPhoto
                    photo={photo}
                    preload={columnIndex === 0 && photoIndex === 0}
                    sizes="(max-width: 640px) calc(49vw - 1rem), (max-width: 1728px) 40vw, 692px"
                  />
                </figure>
              ))}
            </div>
          ))}
        </div>
        <Link className={styles.back} href={`/work#${wedding.slug}`}>← All weddings</Link>
      </main>
    </PageTransition>
  );
}
