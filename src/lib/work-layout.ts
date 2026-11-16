import type { GalleryPhoto } from "./work";

export type PhotoBounds = { top: number; bottom: number };

export function getActiveWorkIndex(sections: PhotoBounds[], anchorY: number) {
  let activeIndex = 0;
  for (let index = 1; index < sections.length; index += 1) {
    const gapMidpoint = (sections[index - 1].bottom + sections[index].top) / 2;
    if (anchorY >= gapMidpoint) activeIndex = index;
  }
  return activeIndex;
}

export function getCaptionLimit(photos: PhotoBounds[], portfolioTop: number) {
  if (!photos.length) return 0;
  const lastPhoto = photos.reduce((last, photo) => photo.bottom > last.bottom ? photo : last);
  return Math.max(0, (lastPhoto.top + lastPhoto.bottom) / 2 - portfolioTop);
}

type ColumnLayout = {
  offset: number;
  gap: number;
  photos: { index: number; width: number; align: "start" | "center" | "end" }[];
};

const layouts: ColumnLayout[][] = [
  [
    { offset: 0, gap: 340, photos: [
      { index: 0, width: 79.5058, align: "end" },
      { index: 2, width: 100, align: "start" },
    ] },
    { offset: 189, gap: 206, photos: [
      { index: 1, width: 100, align: "start" },
      { index: 3, width: 48.7952, align: "center" },
    ] },
  ],
  [
    { offset: 0, gap: 110, photos: [
      { index: 0, width: 79.5058, align: "end" },
      { index: 2, width: 100, align: "start" },
    ] },
    { offset: 98, gap: 161, photos: [
      { index: 1, width: 82.8916, align: "end" },
      { index: 3, width: 65.9036, align: "start" },
    ] },
  ],
];

export function getWorkColumns(weddingId: string) {
  // A stable seed keeps the varied layout identical during server rendering and hydration.
  let seed = 2166136261;
  for (const character of weddingId) {
    seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0;
  }
  return layouts[seed % layouts.length];
}

type MobilePhotoSlot = {
  x: number;
  y: number;
  width: number;
  height?: number;
  crop?: GalleryPhoto["crop"];
};

type MobilePairLayout = readonly [MobilePhotoSlot, MobilePhotoSlot];

// The five mobile Work variations are scaled from the 393px Figma frame.
const portraitLandscapePairs: readonly [MobilePairLayout, MobilePairLayout] = [
  [{ x: 12, y: 0, width: 143 }, { x: 203, y: 62, width: 190 }],
  [{ x: 12, y: 0, width: 83 }, { x: 203, y: 20, width: 178 }],
];

const landscapePortraitPair: MobilePairLayout = [
  { x: -5, y: 62, width: 160 }, { x: 250, y: 0, width: 131 },
];

const similarPhotoPairs: readonly [MobilePairLayout, MobilePairLayout] = [
  [{ x: 60, y: 29, width: 131 }, { x: 262, y: 0, width: 131 }],
  [{ x: 0, y: 0, width: 131 }, { x: 203, y: 15, width: 130 }],
];

const mobilePairs: Partial<Record<string, MobilePairLayout>> = {
  "P04/P08": [
    { ...portraitLandscapePairs[0][0], height: 205, crop: { x: 0, y: -5, width: 143, height: 218 } },
    { ...portraitLandscapePairs[0][1], y: 66, height: 127 },
  ],
  "P13/P14": [
    { ...landscapePortraitPair[0], height: 107, crop: { x: 0, y: -11, width: 160, height: 123 } },
    { ...landscapePortraitPair[1], height: 188, crop: { x: 0, y: -8, width: 135, height: 202 } },
  ],
  "P05/P12": [
    { ...portraitLandscapePairs[1][0], height: 119, crop: { x: -17, y: 0, width: 111, height: 119 } },
    { ...portraitLandscapePairs[1][1], height: 119, crop: { x: 0, y: -5, width: 178, height: 132 } },
  ],
  "P02/P01": [
    { ...similarPhotoPairs[1][0], height: 140, crop: { x: -1, y: -2, width: 132, height: 142 } },
    { ...similarPhotoPairs[1][1], height: 140 },
  ],
};

function getMobilePairLayout(first: GalleryPhoto, second: GalleryPhoto, variant: 0 | 1) {
  const firstIsLandscape = first.image.width > first.image.height;
  const secondIsLandscape = second.image.width > second.image.height;
  if (firstIsLandscape === secondIsLandscape) return similarPhotoPairs[variant];
  return firstIsLandscape ? landscapePortraitPair : portraitLandscapePairs[variant];
}

export function getMobileWorkPair(first: GalleryPhoto, second: GalleryPhoto, variant: 0 | 1) {
  const pairId = `${first.layoutPhotoId ?? first.photoId}/${second.layoutPhotoId ?? second.photoId}`;
  const slots = mobilePairs[pairId] ?? getMobilePairLayout(first, second, variant);

  return [first, second].map(({ photoId, image }, index) => {
    const { x, y, width, height, crop } = slots[index];
    const frame = { width, height: height ?? width * image.height / image.width };

    return { x, y, photo: { photoId, image, frame, crop: crop ?? { x: 0, y: 0, ...frame } } };
  });
}
