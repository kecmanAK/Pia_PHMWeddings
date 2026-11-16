import photoWeddingMapping from "../content/photo-weddings.json";
import { getWeddingBySlug } from "./weddings";

export const portfolioImages = {
  P01: {
    src: "/images/couple_1__05.png",
    width: 1338,
    height: 1438,
    alt: "Bride holding a pink and white bouquet in a bright interior",
  },
  P02: {
    src: "/images/couple_1__06.png",
    width: 1338,
    height: 1438,
    alt: "Lace veil and white flowers resting on grass",
  },
  P03: {
    src: "/images/couple_2_3__02.png",
    width: 706,
    height: 920,
    alt: "Couple embracing at an outdoor floral ceremony",
  },
  P04: {
    src: "/images/couple_2_3__03.png",
    width: 706,
    height: 1076,
    alt: "Black and white portrait of a bride embracing the groom",
  },
  P05: {
    src: "/images/couple_2_3__07.png",
    width: 1338,
    height: 1438,
    alt: "Pink and white bridal bouquet held against a blue sky",
  },
  P06: {
    src: "/images/couple_2_3__13.png",
    width: 538,
    height: 748,
    alt: "Groom kissing the bride as she holds white calla lilies",
  },
  P07: {
    src: "/images/couple_2_3__14.png",
    width: 306,
    height: 410,
    alt: "Bride posing beside a wooden table in a quiet interior",
  },
  P08: {
    src: "/images/couple_3_2__01.png",
    width: 1338,
    height: 894,
    alt: "Smiling newlyweds leaving their outdoor ceremony",
  },
  P09: {
    src: "/images/couple_3_2__04.png",
    width: 1338,
    height: 1030,
    alt: "Groom kissing the bride on a curved modern staircase",
  },
  P10: {
    src: "/images/couple_3_2__08.png",
    width: 1338,
    height: 1022,
    alt: "Black and white portrait of newlyweds sharing a dip kiss",
  },
  P11: {
    src: "/images/couple_3_2__09.png",
    width: 892,
    height: 1338,
    alt: "Artistic motion-blurred floral arrangement in the grass",
  },
  P12: {
    src: "/images/couple_3_2__11.png",
    width: 660,
    height: 488,
    alt: "Black and white portrait of a couple beside a champagne tower",
  },
  P13: {
    src: "/images/couple_3_2__12.png",
    width: 1338,
    height: 1028,
    alt: "Outdoor ceremony flowers arranged in a green grove",
  },
  P14: {
    src: "/images/work-gaia-jan-bride-detail.png",
    width: 892,
    height: 1338,
    alt: "Soft black and white close-up of a bride wearing pearl earrings",
  },
} as const;

export type PhotoId = keyof typeof portfolioImages;

export function getWeddingForPhoto(photoId: PhotoId) {
  const weddingId = photoWeddingMapping[photoId];
  if (weddingId === null) return undefined;
  const wedding = getWeddingBySlug(weddingId);
  if (!wedding) throw new Error(`Photo ${photoId} has an unknown weddingId: ${weddingId}`);
  return wedding;
}

for (const photoId of Object.keys(portfolioImages) as PhotoId[]) {
  if (!(photoId in photoWeddingMapping)) {
    throw new Error(`Missing wedding mapping for photo ${photoId}; use null if unassigned.`);
  }
  getWeddingForPhoto(photoId);
}
for (const photoId of Object.keys(photoWeddingMapping)) {
  if (!(photoId in portfolioImages)) throw new Error(`Unknown photo ID in photo-weddings.json: ${photoId}`);
}
