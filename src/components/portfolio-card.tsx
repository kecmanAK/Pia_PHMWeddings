"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import type { CSSProperties } from "react";

import { animationEase } from "@/lib/motion";

const MotionLink = motion.create(Link);
const MotionImage = motion.create(Image);

export function PortfolioCard({
  image,
  photoId,
  wedding,
  style,
}: {
  image: { src: string; alt: string; width: number; height: number };
  photoId: string;
  wedding?: { slug: string; names: string };
  style: CSSProperties;
}) {
  const media = (
    <span className="portfolio-card__media">
      <MotionImage
        {...image}
        sizes="(max-width: 640px) 42vw, (max-width: 1100px) 36vw, 28rem"
        variants={{
          rest: { filter: "saturate(0.86)", scale: 1 },
          hover: { filter: "saturate(1)", scale: 1.025 },
        }}
        transition={{
          filter: { duration: 0.32, ease: [0.25, 0.1, 0.25, 1] },
          scale: { duration: 0.7, ease: animationEase },
        }}
      />
    </span>
  );

  const animation = { initial: false, animate: "rest", whileHover: "hover", whileFocus: "hover" } as const;

  return wedding ? (
    <MotionLink
      {...animation}
      className="portfolio-card"
      data-photo-id={photoId}
      data-wedding={wedding.slug}
      href={`/weddings/${wedding.slug}#top`}
      prefetch={true}
      aria-label={`${image.alt}. Open ${wedding.names} wedding gallery.`}
      style={style}
    >
      {media}
    </MotionLink>
  ) : (
    <motion.figure {...animation} className="portfolio-card" data-photo-id={photoId} style={style}>
      {media}
    </motion.figure>
  );
}
