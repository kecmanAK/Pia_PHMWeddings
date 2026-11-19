"use client";

import Link from "next/link";
import { cancelFrame, frame } from "motion";
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import type { GalleryPhoto, WorkWedding } from "@/lib/work";
import { getActiveWorkIndex, getCaptionLimit, getMobileWorkPair, getWorkColumns } from "@/lib/work-layout";
import { NavbarLink } from "@/components/navbar-link";
import { WorkPhoto } from "@/components/work-photo";
import workTransition from "@/content/work-transition.json";
import { animationEase, mobileReviewDuration, reviewDuration } from "@/lib/motion";

import styles from "./work-portfolio.module.css";

if (workTransition.mode !== "review-only" && workTransition.mode !== "slide-all") {
  throw new Error("Work transition mode must be review-only or slide-all.");
}

type LayoutStyle = CSSProperties & {
  "--column-offset"?: number;
  "--column-gap"?: number;
  "--photo-width"?: string;
  "--photo-align"?: string;
  "--photo-x"?: number;
  "--photo-y"?: number;
};

function WeddingCaption({ wedding, interactive }: { wedding: WorkWedding; interactive: boolean }) {
  const label = <><h2>{wedding.names}</h2><span>view gallery</span></>;

  return (
    <div className={styles.caption} data-review-side={wedding.testimonial ? wedding.reviewSide : "none"}>
      {interactive ? (
        <NavbarLink
          active={false}
          className={styles.galleryLink}
          href={`/weddings/${wedding.slug}#top`}
          aria-label={`View ${wedding.names} wedding gallery`}
        >
          {label}
        </NavbarLink>
      ) : <div className={styles.galleryLink}>{label}</div>}
      {wedding.testimonial && <blockquote className={styles.testimonial}>“{wedding.testimonial}”</blockquote>}
    </div>
  );
}

function Review({ wedding }: { wedding: WorkWedding }) {
  const isPresent = useIsPresent();
  const reducedMotion = useReducedMotion();
  const offset = wedding.reviewSide === "left"
    ? "translateX(calc(-100% - clamp(1rem, 1.38889cqw, 1.5rem)))"
    : "translateX(calc(100% + clamp(1rem, 1.38889cqw, 1.5rem)))";
  const centered = wedding.reviewSide === "left"
    ? "translateX(calc(0% - clamp(0rem, 0cqw, 0rem)))"
    : "translateX(calc(0% + clamp(0rem, 0cqw, 0rem)))";

  return (
    <motion.blockquote
      className={styles.testimonial}
      data-review-side={wedding.reviewSide}
      aria-hidden={!isPresent || undefined}
      initial={{ transform: offset }}
      animate={{ transform: centered }}
      exit={{ transform: offset }}
      transition={{ duration: reducedMotion ? 0 : reviewDuration, ease: animationEase }}
    >
      “{wedding.testimonial}”
    </motion.blockquote>
  );
}

type CaptionDirection = "forward" | "backward";

const captionSlideVariants = {
  enter: (direction: CaptionDirection) => ({ x: direction === "backward" ? "100%" : "-100%" }),
  centered: { x: "0%" },
  leave: (direction: CaptionDirection) => ({ x: direction === "backward" ? "-100%" : "100%" }),
} satisfies Variants;

function CaptionSlide({ wedding, duration, direction }: {
  wedding: WorkWedding;
  duration: number;
  direction: CaptionDirection;
}) {
  const isPresent = useIsPresent();
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={styles.captionCurrent}
      aria-hidden={!isPresent || undefined}
      inert={!isPresent}
      custom={direction}
      variants={captionSlideVariants}
      initial="enter"
      animate="centered"
      exit="leave"
      transition={{ duration: reducedMotion ? 0 : duration, ease: animationEase }}
    >
      <WeddingCaption wedding={wedding} interactive={isPresent} />
    </motion.div>
  );
}

function ReviewOnlyCaption({ wedding }: { wedding: WorkWedding }) {
  return (
    <div className={styles.captionWindow}>
      <div
        className={`${styles.caption} ${styles.reviewOnlyCaption}`}
        data-review-side={wedding.testimonial ? undefined : "none"}
      >
        <NavbarLink
          active={false}
          className={styles.galleryLink}
          href={`/weddings/${wedding.slug}#top`}
          aria-label={`View ${wedding.names} wedding gallery`}
        >
          <h2>{wedding.names}</h2>
          <span>view gallery</span>
        </NavbarLink>
        <AnimatePresence initial={false}>
          {wedding.testimonial && <Review key={wedding.slug} wedding={wedding} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WeddingPhotoLink({ wedding, photo, style, preload }: {
  wedding: WorkWedding;
  photo: GalleryPhoto;
  style: LayoutStyle;
  preload?: boolean;
}) {
  return (
    <Link
      className={styles.photo}
      data-work-photo
      data-photo-id={photo.photoId}
      href={`/weddings/${wedding.slug}#top`}
      aria-label={`${photo.image.alt}. View ${wedding.names} wedding gallery.`}
      style={style}
    >
      <WorkPhoto photo={photo} preload={preload} />
    </Link>
  );
}

function MobilePhotoPair({ wedding, start, variant }: { wedding: WorkWedding; start: 0 | 2; variant: 0 | 1 }) {
  return (
    <div className={styles.mobilePair}>
      {getMobileWorkPair(wedding.photos[start], wedding.photos[start + 1], variant).map(({ photo, x, y }) => (
        <WeddingPhotoLink
          key={photo.photoId}
          wedding={wedding}
          photo={photo}
          style={{
            "--photo-width": `${photo.frame.width / 393 * 100}%`,
            "--photo-x": x,
            "--photo-y": y,
          }}
        />
      ))}
    </div>
  );
}

export function WorkPortfolio({ weddings }: { weddings: WorkWedding[] }) {
  const portfolioRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeCaption, setActiveCaption] = useState({
    index: 0,
    slideId: 0,
    duration: reviewDuration,
    direction: "forward" as CaptionDirection,
  });
  const activeWedding = weddings[activeCaption.index] ?? weddings[0];

  useEffect(() => {
    let framePending = false;
    const mobile = window.matchMedia("(max-width: 640px)");

    const updateScrollState = () => {
      framePending = false;
      const portfolio = portfolioRef.current;
      if (!portfolio) return;

      const isMobile = mobile.matches;
      const photoLayout = isMobile ? styles.mobileLayout : styles.columns;
      const portfolioTop = portfolio.getBoundingClientRect().top;

      const groups = groupRefs.current.slice(0, weddings.length).map((group) => {
        const layout = group?.querySelector(`.${photoLayout}`);
        const photos = Array.from(layout?.querySelectorAll("[data-work-photo]") ?? [],
          (photo) => photo.getBoundingClientRect());
        return {
          photos,
          top: Math.min(...photos.map((photo) => photo.top)),
          bottom: Math.max(...photos.map((photo) => photo.bottom)),
        };
      });
      if (groups.some((group) => !group.photos.length)) return;

      let anchorY = window.innerHeight / 2;
      if (isMobile) {
        const firstGap = portfolio.querySelector(`.${styles.mobileCaptionSpace}`)?.getBoundingClientRect();
        if (!firstGap) return;

        const start = (firstGap.top + firstGap.bottom) / 2 - portfolioTop;
        anchorY = Math.min(anchorY, start);
        const startOffset = `${start}px`;
        if (portfolio.style.getPropertyValue("--caption-start") !== startOffset) {
          portfolio.style.setProperty("--caption-start", startOffset);
          portfolio.dataset.mobileCaptionReady = "";
        }
      }
      const nextIndex = getActiveWorkIndex(groups, anchorY);
      const duration = isMobile ? mobileReviewDuration : reviewDuration;
      setActiveCaption((current) => {
        const slideId = current.index === nextIndex ? current.slideId : current.slideId + 1;
        if (slideId === current.slideId && duration === current.duration) return current;
        return {
          index: nextIndex,
          slideId,
          duration,
          direction: isMobile && nextIndex < current.index ? "backward" : "forward",
        };
      });

      const finalPhotos = groups.at(-1)?.photos ?? [];
      const limit = `${getCaptionLimit(finalPhotos, portfolioTop)}px`;
      if (portfolio.style.getPropertyValue("--caption-limit") !== limit) {
        portfolio.style.setProperty("--caption-limit", limit);
      }
    };

    const scheduleUpdate = () => {
      if (!framePending) {
        framePending = true;
        frame.read(updateScrollState);
      }
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("pageshow", scheduleUpdate);
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    if (portfolioRef.current) resizeObserver.observe(portfolioRef.current);
    groupRefs.current.forEach((group) => { if (group) resizeObserver.observe(group); });

    return () => {
      resizeObserver.disconnect();
      cancelFrame(updateScrollState);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("pageshow", scheduleUpdate);
    };
  }, [weddings]);

  return (
    <div className={styles.portfolio} ref={portfolioRef}>
      <div className={styles.captionTrack}>
        <div className={styles.stickyCaption}>
          {workTransition.mode === "review-only" && (
            <div className={styles.desktopCaption}>
              <ReviewOnlyCaption wedding={activeWedding} />
            </div>
          )}
          <div
            className={`${styles.captionWindow} ${styles.mobileCaption}`}
            data-mobile-only={workTransition.mode === "review-only" || undefined}
          >
            <AnimatePresence initial={false} custom={activeCaption.direction}>
              <CaptionSlide
                key={activeCaption.slideId}
                wedding={activeWedding}
                duration={activeCaption.duration}
                direction={activeCaption.direction}
              />
            </AnimatePresence>
          </div>
        </div>
      </div>

      {weddings.map((wedding, weddingIndex) => (
        <section
          id={wedding.slug}
          key={wedding.slug}
          className={styles.group}
          aria-label={`${wedding.names} wedding photographs`}
          ref={(element) => { groupRefs.current[weddingIndex] = element; }}
        >
          <div className={styles.mobileLayout}>
            <MobilePhotoPair wedding={wedding} start={0} variant={weddingIndex % 2 === 0 ? 0 : 1} />
            <div className={`${styles.mobileCaptionSpace} ${styles.mobileCaption}`}>
              <WeddingCaption wedding={wedding} interactive />
            </div>
            <MobilePhotoPair wedding={wedding} start={2} variant={weddingIndex % 2 === 0 ? 1 : 0} />
          </div>
          <div className={styles.columns}>
            {getWorkColumns(wedding.slug).map((column, columnIndex) => (
              <div
                className={styles.column}
                key={columnIndex}
                style={{ "--column-offset": column.offset, "--column-gap": column.gap } as LayoutStyle}
              >
                {column.photos.map((slot) => {
                  const photo = wedding.photos[slot.index];
                  return (
                    <WeddingPhotoLink
                      key={photo.photoId}
                      wedding={wedding}
                      photo={photo}
                      preload={weddingIndex === 0 && slot.index < 2}
                      style={{ "--photo-width": `${slot.width}%`, "--photo-align": slot.align }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
