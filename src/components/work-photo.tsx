import Image from "next/image";

import type { GalleryPhoto as Photo } from "@/lib/work";

import styles from "./work-portfolio.module.css";

export function WorkPhoto({
  photo,
  preload = false,
  sizes = `(max-width: 640px) 50vw, ${(photo.frame.width / 1728) * 100}vw`,
}: {
  photo: Photo;
  preload?: boolean;
  sizes?: string;
}) {
  const { image } = photo;

  return (
    <span
      className={styles.media}
      style={{ aspectRatio: `${photo.frame.width} / ${photo.frame.height}` }}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        preload={preload}
        sizes={sizes}
        style={{ objectFit: "cover" }}
      />
    </span>
  );
}
