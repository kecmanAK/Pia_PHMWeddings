export const homepageDocumentId = "homepage";
export const spherePhotoCount = 13;

export const defaultHomepageCopy = {
  sphereHeadline: "Soft, elegant\nand full of\nlife.",
  stickyText: "Photographs that blend a modern aesthetic with authentic emotion, reminding you both of how it felt and how you felt.",
};

export const defaultMobileSphereLines = ["Soft", "Elegant", "and full", "of life."];

// Existing Homepage entries use these IDs until their Sanity asset references are saved.
const legacyPhotoHashes: Readonly<Record<string, string>> = {
  P01: "fdb8cd954f31c77a10d5f66e8b6755cb1540823d",
  P02: "c30b1165436a3affd120968f6fa78e242b51799a",
  P03: "121bec9beda5bde863760ce260ba337ddb88e62b",
  P04: "f0c44ef56b2275382c68cbc2ba38e9baddfba779",
  P05: "76f903cf583019ebfe994da41d822c6ef1f69d36",
  P06: "b1985779955b03c145e0aa9790c332ab65fb9d2e",
  P07: "391642db474cb6e7678d2f9116bc357285af2f7d",
  P08: "890fee148f324901526ef1cffa272c82608bcfb3",
  P09: "a7ce998895c682ba43d5bfbf028b11430e8c66bc",
  P10: "bed1ce4f0c6f5b6e08b45a73a743ccfedb5102e8",
  P11: "1d6c088de593721f5fa5d3efab90cb95017f5259",
  P12: "aaf1c638b06f48092a8f1897be974fe41a29d370",
  P13: "40ddd25b8605b1218a95361174f43973b4e9ec1e",
  P14: "6443524aa138a3e0b689159d627bef767f511615",
};

export const legacyHomepagePhotoHashes = Object.values(legacyPhotoHashes);

export function homepagePhotoIdentity(photoId?: string, asset?: string) {
  if (photoId && Object.hasOwn(legacyPhotoHashes, photoId)) {
    return legacyPhotoHashes[photoId];
  }

  const file = asset?.slice(asset.lastIndexOf("/") + 1);
  const assetId = file?.replace(/^image-/, "").replace(/\.(\w+)$/, "-$1");
  return assetId?.match(/^([a-f0-9]{40})(?:-|$)/i)?.[1].toLowerCase() ?? assetId;
}
