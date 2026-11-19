export type GalleryPhoto = {
  photoId: string;
  image: { src: string; alt: string; width: number; height: number };
  frame: { width: number; height: number };
};

export type WorkWedding = {
  slug: string;
  names: string;
  testimonial?: string;
  reviewSide: "left" | "right";
  photos: GalleryPhoto[];
};

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
