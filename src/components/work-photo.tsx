import Image from "next/image";
import type { CSSProperties } from "react";

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
  const cropStyle: CSSProperties = {
    left: `${(photo.crop.x / photo.frame.width) * 100}%`,
    top: `${(photo.crop.y / photo.frame.height) * 100}%`,
    width: `${(photo.crop.width / photo.frame.width) * 100}%`,
    height: `${(photo.crop.height / photo.frame.height) * 100}%`,
  };

  return (
    <span
      className={styles.media}
      style={{ aspectRatio: `${photo.frame.width} / ${photo.frame.height}` }}
      data-figma-node={photo.nodeId}
    >
      <span className={styles.crop} style={cropStyle}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          preload={preload}
          sizes={sizes}
          style={{ objectFit: "cover" }}
        />
      </span>
    </span>
  );
}
