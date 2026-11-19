import { cacheLife } from "next/cache";

import { aboutDocumentId, defaultAboutBiography, type AboutPortrait } from "@/content/about";
import { getSanityImagePath, queryPublishedSanity } from "@/lib/sanity";

type AboutDocument = {
  biography?: unknown;
  portrait?: {
    src?: string | null;
    alt?: string | null;
    dimensions?: { width: number; height: number } | null;
  } | null;
};

function getPortrait(portrait: AboutDocument["portrait"]): AboutPortrait | undefined {
  const imagePath = getSanityImagePath();
  const src = portrait?.src;
  const dimensions = portrait?.dimensions;
  if (!imagePath || !src?.startsWith(`https://cdn.sanity.io${imagePath}`) || /[?#]/.test(src) ||
      !dimensions || !Number.isSafeInteger(dimensions.width) || !Number.isSafeInteger(dimensions.height) ||
      dimensions.width < 1 || dimensions.height < 1) {
    return undefined;
  }

  return {
    src,
    alt: portrait?.alt?.trim() || "Portrait of Pia",
    width: dimensions.width,
    height: dimensions.height,
  };
}

export async function getAboutContent() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });

  const about = await queryPublishedSanity<AboutDocument | null>(
    `*[_id == $id && _type == $id][0]{
      biography,
      portrait{alt, "src": asset->url, "dimensions": asset->metadata.dimensions}
    }`,
    { id: aboutDocumentId },
  );
  const biography = typeof about?.biography === "string" ? about.biography.trim() : "";
  return { biography: biography || defaultAboutBiography, portrait: getPortrait(about?.portrait) };
}
