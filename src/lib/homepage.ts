import { cacheLife } from "next/cache";
import { getImageProps } from "next/image";

import { defaultHomepageCopy, homepageDocumentId, homepagePhotoIdentity, legacyHomepagePhotoHashes, spherePhotoCount } from "@/content/homepage";

import { getSanityImagePath, queryPublishedSanity } from "./sanity";
import { getPublishedWeddings } from "./wedding-content";

type Image = { src: string; alt: string; width: number; height: number };

export type SpherePhoto = {
  alt: string;
  aspect: number;
  desktopSrc: string;
  mobileSrc: string;
};

const sphereMobileDisplayWidth = 256;
const sphereDesktopDisplayWidth = 600;

type GridPhoto = {
  id: string;
  image: Image;
  wedding?: { slug: string; names: string };
};

type SanityImage = {
  alt?: string | null;
  src?: string | null;
  dimensions?: { width: number; height: number } | null;
};

type HomepagePhoto = SanityImage & {
  _key: string;
  _type: string;
  photoId?: string;
  weddingId?: string;
  photoKey?: string;
};

const imageProjection = `_key, _type, photoId, alt,
  "weddingId": wedding._ref, photoKey,
  "src": asset->url, "dimensions": asset->metadata.dimensions`;

function readImage(photo: SanityImage, imageBase?: string): Image | undefined {
  const { src, dimensions } = photo;
  if (!imageBase || typeof src !== "string" || !src.startsWith(imageBase) || /[?#]/.test(src) || !dimensions) return undefined;
  const { width, height } = dimensions;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) return undefined;
  return { src, width, height, alt: photo.alt?.trim() || "PHM Weddings portfolio photograph" };
}

function makeSpherePhoto(image: Image): SpherePhoto {
  const { src, alt, width, height } = image;
  const aspect = width / height;
  const optimizedTexture = (displayWidth: number) => getImageProps({
    src,
    alt,
    width: displayWidth,
    height: Math.max(1, Math.round(displayWidth / aspect)),
  }).props.src;

  return {
    alt,
    aspect,
    mobileSrc: optimizedTexture(sphereMobileDisplayWidth),
    desktopSrc: optimizedTexture(sphereDesktopDisplayWidth),
  };
}

export async function getHomepageContent() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });

  const imagePath = getSanityImagePath();
  const imageBase = imagePath && `https://cdn.sanity.io${imagePath}`;
  const homepage = await queryPublishedSanity<{
    sphereHeadline?: string | null;
    stickyText?: string | null;
    spherePhotos?: HomepagePhoto[] | null;
    gridPhotos?: HomepagePhoto[] | null;
    legacyAssets?: (SanityImage & { sha1hash: string })[];
  } | null>(
    `*[_id == $id && _type == $id][0] {
      sphereHeadline, stickyText,
      spherePhotos[]{${imageProjection}}, gridPhotos[]{${imageProjection}},
      "legacyAssets": select(
        defined(spherePhotos[_type == "homepageBuiltInPhoto"][0]) || defined(gridPhotos[_type == "homepageBuiltInPhoto"][0])
        => *[_type == "sanity.imageAsset" && sha1hash in $legacyHashes] | order(_id asc) {
          sha1hash, "src": url, "alt": altText, "dimensions": metadata.dimensions
        },
        []
      )
    }`,
    { id: homepageDocumentId, legacyHashes: legacyHomepagePhotoHashes },
  );

  const legacyAssets = new Map(homepage?.legacyAssets?.map((asset) => [asset.sha1hash, asset]));
  function resolveImage(photo: HomepagePhoto) {
    const legacyHash = homepagePhotoIdentity(photo.photoId);
    const image = photo._type === "homepageBuiltInPhoto" ? legacyAssets.get(legacyHash ?? "") : photo;
    if (image) return readImage(image, imageBase);
  }

  const sphereImages = (homepage?.spherePhotos ?? []).map(resolveImage);
  const sphere = sphereImages.length === spherePhotoCount && sphereImages.every((image): image is Image => Boolean(image)) &&
    new Set(sphereImages.map((image) => image.src)).size === spherePhotoCount
    ? sphereImages.map(makeSpherePhoto)
    : [];
  const selection = homepage?.gridPhotos ?? [];
  const hasWeddingPhotos = selection.some((photo) => photo._type === "homepageWeddingPhoto");
  const publishedWeddings = hasWeddingPhotos ? await getPublishedWeddings() : [];
  const weddings = new Map(publishedWeddings.map((wedding) => [wedding.documentId, wedding]));
  const grid = new Map<string, GridPhoto>();

  for (const photo of selection) {
    if (photo._type === "homepageWeddingPhoto") {
      const wedding = photo.weddingId ? weddings.get(photo.weddingId) : undefined;
      const image = wedding?.photos.find(({ photoId }) => photoId === photo.photoKey)?.image;
      if (wedding && image) {
        const identity = homepagePhotoIdentity(undefined, image.src) ?? image.src;
        grid.set(identity, {
          id: grid.get(identity)?.id ?? photo._key,
          image,
          wedding: { slug: wedding.slug, names: wedding.names },
        });
      }
      continue;
    }
    const image = resolveImage(photo);
    if (!image) continue;
    const identity = homepagePhotoIdentity(photo.photoId, image.src) ?? image.src;
    if (!grid.has(identity)) {
      grid.set(identity, { id: photo._key, image });
    }
  }

  return {
    sphereHeadline: homepage?.sphereHeadline?.trim() || defaultHomepageCopy.sphereHeadline,
    stickyText: homepage?.stickyText?.trim() || defaultHomepageCopy.stickyText,
    sphere,
    grid: [...grid.values()],
  };
}
