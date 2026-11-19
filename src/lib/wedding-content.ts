import { cacheLife } from "next/cache";

import { orderWorkGalleries, workOrderDocumentId } from "@/content/work-order";

import { getSanityImagePath, queryPublishedSanity } from "./sanity";
import type { GalleryPhoto, WorkWedding } from "./work";

type SanityPhoto = {
  _key?: string;
  alt?: string;
  highlight?: boolean;
  src?: string;
  dimensions?: { width: number; height: number };
};

type SanityWedding = {
  _id?: string;
  slug?: string;
  names?: string;
  venue?: string | null;
  testimonial?: string;
  showReviewOnWork?: boolean;
  photos?: SanityPhoto[];
};

type PublishedWedding = {
  documentId?: string;
  slug: string;
  names: string;
  venue?: string;
  testimonial?: string;
  showReviewOnWork: boolean;
  photos: GalleryPhoto[];
  highlights: GalleryPhoto[];
};

const weddingsQuery = `*[_type == "wedding"] | order(_createdAt asc, _id asc) {
  _id, "slug": slug.current, names, venue, testimonial, showReviewOnWork,
  photos[] { _key, alt, highlight, "src": asset->url, "dimensions": asset->metadata.dimensions }
}`;

function readWedding(wedding: SanityWedding, imageBase: string): PublishedWedding | undefined {
  const { slug, photos } = wedding;
  const names = wedding.names?.trim();
  const venue = wedding.venue?.trim() || undefined;
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !names || !Array.isArray(photos)) return;

  const gallery: GalleryPhoto[] = [];
  const highlights: GalleryPhoto[] = [];
  const sources = new Set<string>();
  const keys = new Set<string>();

  for (const { _key, src, alt, dimensions, highlight } of photos) {
    if (!_key || keys.has(_key) || !src?.startsWith(imageBase) || sources.has(src) || /[?#]/.test(src)) return;
    if (!dimensions || !Number.isFinite(dimensions.width) || !Number.isFinite(dimensions.height)) return;
    const { width, height } = dimensions;
    if (width <= 0 || height <= 0) return;

    keys.add(_key);
    sources.add(src);
    const photo: GalleryPhoto = {
      photoId: _key,
      image: { src, alt: alt?.trim() || `${names} wedding photograph`, width, height },
      frame: { width, height },
    };
    gallery.push(photo);
    if (highlight === true) highlights.push(photo);
  }

  if (highlights.length !== 4) return;
  return {
    documentId: wedding._id,
    slug, names, venue,
    testimonial: wedding.testimonial?.trim() || undefined,
    showReviewOnWork: wedding.showReviewOnWork !== false,
    photos: gallery,
    highlights,
  };
}

export async function getPublishedWeddings() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });

  const imagePath = getSanityImagePath();
  if (!imagePath) return [];

  const documents = await queryPublishedSanity<SanityWedding[]>(weddingsQuery);
  if (!Array.isArray(documents)) return [];

  const weddings = new Map<string, PublishedWedding>();
  for (const document of documents) {
    const wedding = readWedding(document, `https://cdn.sanity.io${imagePath}`);
    if (wedding && !weddings.has(wedding.slug)) weddings.set(wedding.slug, wedding);
  }
  return [...weddings.values()];
}

async function getPublishedWorkOrder() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });

  return queryPublishedSanity<string[] | null>(
    '*[_id == $id && _type == $id][0].weddingIds',
    { id: workOrderDocumentId },
  );
}

export async function getWorkWeddings(): Promise<WorkWedding[]> {
  const [weddings, order] = await Promise.all([getPublishedWeddings(), getPublishedWorkOrder()]);
  return orderWorkGalleries(weddings, Array.isArray(order) ? order : [], (wedding) => wedding.documentId).map((wedding, index) => ({
    slug: wedding.slug,
    names: wedding.names,
    testimonial: wedding.showReviewOnWork ? wedding.testimonial : undefined,
    reviewSide: index % 2 === 0 ? "right" : "left",
    photos: wedding.highlights,
  }));
}

export async function getWeddingGallery(slug: string) {
  const weddings = await getPublishedWeddings();
  const direct = weddings.find((wedding) => wedding.slug === slug);
  if (direct) return direct;

  const matches = weddings.filter((wedding) => wedding.slug.replaceAll("-and-", "-") === slug);
  return matches.length === 1 ? matches[0] : undefined;
}
