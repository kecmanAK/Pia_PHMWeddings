import workSettings from "../content/work-settings.json";
import { getWeddingForPhoto, portfolioImages, type PhotoId } from "./portfolio-images";
import { getWeddingBySlug } from "./weddings";

export type GalleryPhoto = {
  photoId: string;
  layoutPhotoId?: string;
  image: { src: string; alt: string; width: number; height: number };
  nodeId?: string;
  frame: { width: number; height: number };
  crop: { x: number; y: number; width: number; height: number };
};

export type WorkWedding = {
  slug: string;
  layoutSlug?: string;
  names: string;
  testimonial?: string;
  reviewSide: "left" | "right";
  photos: GalleryPhoto[];
};

const photoCrops: Partial<Record<PhotoId, Omit<GalleryPhoto, "photoId" | "image">>> = {
  P04: {
    nodeId: "321:158",
    frame: { width: 547, height: 685 },
    crop: { x: -8, y: -58, width: 555, height: 845 },
  },
  P08: {
    nodeId: "321:150",
    frame: { width: 688, height: 435 },
    crop: { x: 0, y: -29, width: 695, height: 464 },
  },
  P13: {
    nodeId: "321:168",
    frame: { width: 688, height: 517 },
    crop: { x: 0, y: 0, width: 688, height: 529 },
  },
  P14: {
    nodeId: "321:154",
    frame: { width: 547, height: 730 },
    crop: { x: 1, y: -56, width: 546, height: 819 },
  },
  P05: {
    nodeId: "321:148",
    frame: { width: 547, height: 702 },
    crop: { x: -61, y: 0, width: 653, height: 702 },
  },
  P12: {
    nodeId: "321:152",
    frame: { width: 830, height: 585 },
    crop: { x: 0, y: -32, width: 835, height: 617 },
  },
  P09: {
    nodeId: "321:160",
    frame: { width: 547, height: 389 },
    crop: { x: 0, y: -46, width: 565, height: 435 },
  },
  P02: {
    nodeId: "321:162",
    frame: { width: 688, height: 740 },
    crop: { x: -1, y: -38, width: 724, height: 778 },
  },
  P10: {
    nodeId: "321:164",
    frame: { width: 688, height: 543 },
    crop: { x: -29, y: -5, width: 717, height: 548 },
  },
  P01: {
    nodeId: "321:166",
    frame: { width: 405, height: 512 },
    crop: { x: -19, y: 0, width: 489, height: 526 },
  },
};

// Sanity keeps the original file hash even when an upload has been renamed.
const photoIdsByHash = new Map<string, PhotoId>([
  ["fdb8cd954f31c77a10d5f66e8b6755cb1540823d", "P01"],
  ["c30b1165436a3affd120968f6fa78e242b51799a", "P02"],
  ["121bec9beda5bde863760ce260ba337ddb88e62b", "P03"],
  ["f0c44ef56b2275382c68cbc2ba38e9baddfba779", "P04"],
  ["76f903cf583019ebfe994da41d822c6ef1f69d36", "P05"],
  ["890fee148f324901526ef1cffa272c82608bcfb3", "P08"],
  ["a7ce998895c682ba43d5bfbf028b11430e8c66bc", "P09"],
  ["bed1ce4f0c6f5b6e08b45a73a743ccfedb5102e8", "P10"],
  ["1d6c088de593721f5fa5d3efab90cb95017f5259", "P11"],
  ["aaf1c638b06f48092a8f1897be974fe41a29d370", "P12"],
  ["40ddd25b8605b1218a95361174f43973b4e9ec1e", "P13"],
  ["6443524aa138a3e0b689159d627bef767f511615", "P14"],
]);

function getPhoto(photoId: PhotoId): GalleryPhoto {
  const image = portfolioImages[photoId];
  return {
    photoId,
    image,
    ...(photoCrops[photoId] ?? {
      frame: { width: image.width, height: image.height },
      crop: { x: 0, y: 0, width: image.width, height: image.height },
    }),
  };
}

export function getOriginalGalleryPhoto(weddingSlug: string, hash: string) {
  const photoId = photoIdsByHash.get(hash);
  if (photoId && getWeddingForPhoto(photoId)?.slug === weddingSlug) return getPhoto(photoId);
}

export const workWeddings: WorkWedding[] = Object.entries(workSettings).map(([slug, settings]) => {
  const wedding = getWeddingBySlug(slug);
  if (!wedding) throw new Error(`Unknown wedding in work-settings.json: ${slug}`);
  if (settings.reviewSide !== "left" && settings.reviewSide !== "right") {
    throw new Error(`Choose left or right for ${wedding.names}'s reviewSide.`);
  }
  if (settings.photoIds.length !== 4 || new Set(settings.photoIds).size !== 4) {
    throw new Error(`Select exactly four different Work photos for ${wedding.names}.`);
  }

  const photos = settings.photoIds.map((id) => {
    if (!Object.hasOwn(portfolioImages, id)) throw new Error(`Unknown Work photo: ${id}`);
    const photoId = id as PhotoId;
    if (getWeddingForPhoto(photoId)?.slug !== slug) {
      throw new Error(`Work photo ${photoId} does not belong to ${wedding.names}.`);
    }
    return getPhoto(photoId);
  });

  return {
    slug: wedding.slug,
    names: wedding.names,
    testimonial: wedding.showReviewOnWork === false ? undefined : wedding.testimonial,
    reviewSide: settings.reviewSide,
    photos,
  };
});

export function getGalleryPhotos(weddingId: string): GalleryPhoto[] {
  const photoIds = [...new Set([
    ...Object.keys(photoCrops),
    ...Object.keys(portfolioImages),
  ])] as PhotoId[];

  return photoIds
    .filter((photoId) => getWeddingForPhoto(photoId)?.slug === weddingId)
    .map(getPhoto);
}

export function getGalleryColumns(photos: GalleryPhoto[]) {
  const columns: [GalleryPhoto[], GalleryPhoto[]] = [[], []];
  const heights = [0, 0];
  const gapRatio = 44 / 692;

  for (const photo of photos) {
    const column = heights[0] <= heights[1] ? 0 : 1;
    columns[column].push(photo);
    heights[column] += photo.frame.height / photo.frame.width + gapRatio;
  }

  return columns;
}
