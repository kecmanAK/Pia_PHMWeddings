"use client";

import { animate, type AnimationPlaybackControls } from "motion";
import { MotionConfig, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { anchorScrollDuration, anchorScrollEase, interactionDuration } from "@/lib/motion";

function AnchorScroll() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let animation: AnimationPlaybackControls | undefined;
    const stop = () => animation?.stop();

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || link.download || (link.target && link.target !== "_self")) return;
      stop();

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || url.search !== window.location.search || !url.hash) return;

      let target: HTMLElement | null;
      try {
        target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      } catch {
        return;
      }
      if (!target) return;

      event.preventDefault();
      if (url.href !== window.location.href) window.history.pushState(null, "", url);
      const top = target.getBoundingClientRect().top + window.scrollY;
      if (reducedMotion) {
        window.scrollTo({ top, behavior: "instant" });
        return;
      }

      animation = animate(window.scrollY, top, {
        duration: anchorScrollDuration,
        ease: anchorScrollEase,
        onUpdate: (value) => {
          if (window.location.pathname !== url.pathname) {
            stop();
            return;
          }
          window.scrollTo({ top: value, behavior: "instant" });
        },
      });
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    return () => {
      stop();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [reducedMotion]);

  return null;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: interactionDuration, ease: "easeOut" }}>
      <AnchorScroll />
      {children}
    </MotionConfig>
  );
}
