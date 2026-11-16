import { cacheLife } from "next/cache";

import { getSanityImagePath, queryPublishedSanity } from "./sanity";
import { getGalleryPhotos, getOriginalGalleryPhoto, workWeddings, type GalleryPhoto, type WorkWedding } from "./work";
import { getWeddingBySlug } from "./weddings";

type SanityPhoto = {
  _key?: string;
  alt?: string;
  highlight?: boolean;
  src?: string;
  hash?: string;
  dimensions?: { width: number; height: number };
};

type SanityWedding = {
  slug?: string;
  names?: string;
  venue?: string | null;
  testimonial?: string;
  showReviewOnWork?: boolean;
  photos?: SanityPhoto[];
};

type PublishedWedding = {
  slug: string;
  layoutSlug?: string;
  names: string;
  venue?: string;
  testimonial?: string;
  showReviewOnWork: boolean;
  photos: GalleryPhoto[];
  highlights: GalleryPhoto[];
};

const weddingsQuery = `*[_type == "wedding"] | order(_createdAt asc, _id asc) {
  "slug": slug.current, names, venue, testimonial, showReviewOnWork,
  photos[] { _key, alt, highlight, "src": asset->url, "hash": asset->sha1hash, "dimensions": asset->metadata.dimensions }
}`;

function readWedding(wedding: SanityWedding, imageBase: string): PublishedWedding | undefined {
  const { slug, photos } = wedding;
  const names = wedding.names?.trim();
  const venue = wedding.venue?.trim() || undefined;
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !names || !Array.isArray(photos)) return;

  const layoutSlug = getWeddingBySlug(slug)?.slug ?? getWeddingBySlug(slug.replace("-and-", "-"))?.slug;
  const gallery: GalleryPhoto[] = [];
  const highlights: GalleryPhoto[] = [];
  const sources = new Set<string>();
  const keys = new Set<string>();

  for (const { _key, src, alt, hash, dimensions, highlight } of photos) {
    if (!_key || keys.has(_key) || !src?.startsWith(imageBase) || sources.has(src) || /[?#]/.test(src)) return;
    if (!dimensions || !Number.isFinite(dimensions.width) || !Number.isFinite(dimensions.height)) return;
    const { width, height } = dimensions;
    if (width <= 0 || height <= 0) return;

    keys.add(_key);
    sources.add(src);
    const original = layoutSlug && hash ? getOriginalGalleryPhoto(layoutSlug, hash) : undefined;
    const photo: GalleryPhoto = {
      photoId: _key,
      layoutPhotoId: original?.photoId,
      nodeId: original?.nodeId,
      image: { src, alt: alt?.trim() || original?.image.alt || `${names} wedding photograph`, width, height },
      frame: original?.frame ?? { width, height },
      crop: original?.crop ?? { x: 0, y: 0, width, height },
    };
    gallery.push(photo);
    if (highlight === true) highlights.push(photo);
  }

  if (highlights.length !== 4) return;
  return {
    slug, layoutSlug, names, venue,
    testimonial: wedding.testimonial?.trim() || undefined,
    showReviewOnWork: wedding.showReviewOnWork !== false,
    photos: gallery,
    highlights,
  };
}

async function getPublishedWeddings() {
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

function toWorkWedding(wedding: PublishedWedding, reviewSide: WorkWedding["reviewSide"]): WorkWedding {
  return {
    slug: wedding.slug,
    layoutSlug: wedding.layoutSlug,
    names: wedding.names,
    testimonial: wedding.showReviewOnWork ? wedding.testimonial : undefined,
    reviewSide,
    photos: wedding.highlights,
  };
}

export async function getWorkWeddings() {
  const published = new Map((await getPublishedWeddings()).map((wedding) => [wedding.slug, wedding]));
  const weddings = workWeddings.map((fallback) => {
    const wedding = published.get(fallback.slug);
    if (!wedding) return fallback;
    published.delete(wedding.slug);
    return toWorkWedding(wedding, fallback.reviewSide);
  });

  for (const wedding of published.values()) {
    const reviewSide = weddings.at(-1)?.reviewSide === "right" ? "left" : "right";
    weddings.push(toWorkWedding(wedding, reviewSide));
  }
  return weddings;
}

export async function getWeddingGallery(slug: string) {
  const published = (await getPublishedWeddings()).find((wedding) => wedding.slug === slug);
  if (published) return published;

  const fallback = getWeddingBySlug(slug);
  if (fallback) return { ...fallback, photos: getGalleryPhotos(slug) };
}
