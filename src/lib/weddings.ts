type WeddingDetails = {
  names: string;
  venue: string;
  testimonial?: string | null;
  showReviewOnWork?: boolean;
};

export const weddingDetails = {
  "gaia-jan": {
    names: "Gaia & Jan",
    venue: "Kodarinov malen",
    testimonial: "We loved the way you captured the emotions and the adventure. We get compliments from people all the time on how beautiful and natural the photos are!",
  },
  "edcelyn-rok": {
    names: "Edcelyn & Rok",
    venue: "Galerija okusov",
    testimonial: "You were so non-invasive, relaxed, and great at making us and our guests feel comfortable. You captured the natural, magical vibe of the day perfectly—100% worth recommending!",
  },
} as const satisfies Record<string, WeddingDetails>;

export type WeddingId = keyof typeof weddingDetails;

export function getWeddingBySlug(slug: string) {
  if (!Object.hasOwn(weddingDetails, slug)) return undefined;
  const weddingId = slug as WeddingId;
  const wedding: WeddingDetails = weddingDetails[weddingId];
  return { ...wedding, slug: weddingId, testimonial: wedding.testimonial?.trim() || undefined };
}
