"use client";

import { animate, cancelFrame, frame, type AnimationPlaybackControls } from "motion";
import { useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";

import { pageDuration, pageEase, pageOffset } from "@/lib/motion";

export function PageTransition({ children, pageKey }: { children: ReactNode; pageKey: string }) {
  const reducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);

  // Layout effects reconnect when Next reveals a cached Activity, so Back gets
  // the same entrance without remounting the page or rebuilding the sphere.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || (reducedMotion ?? window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;

    const previousOpacity = content.style.opacity;
    const previousTransform = content.style.transform;
    let animation: AnimationPlaybackControls | undefined;
    let cancelled = false;
    content.style.opacity = "0";

    const resetTransform = () => {
      if (!cancelled) content.style.transform = previousTransform;
    };

    const enter = () => {
      animation = animate(content, {
        opacity: [0, 1],
        transform: [`translateY(${pageOffset}px)`, "none"],
      }, { duration: pageDuration, ease: pageEase });
      void animation.finished.then(() => {
        if (!cancelled) frame.postRender(resetTransform);
      });
    };

    // Let Next's layout effects restore scroll before transforming the content.
    // The animation starts in Motion's next frame, before that frame is painted.
    frame.update(enter);

    return () => {
      cancelled = true;
      cancelFrame(enter);
      cancelFrame(resetTransform);
      animation?.stop();
      content.style.opacity = previousOpacity;
      content.style.transform = previousTransform;
    };
  }, [pageKey, reducedMotion]);

  return (
    <div ref={contentRef} data-page-content={pageKey}>
      {children}
    </div>
  );
}
