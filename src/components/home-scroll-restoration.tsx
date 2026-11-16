"use client";

import { useLayoutEffect } from "react";

let homeScrollPosition: { left: number; top: number } | null = null;

export function HomeScrollRestoration() {
  useLayoutEffect(() => {
    if (homeScrollPosition && !window.location.hash) {
      window.scrollTo({ ...homeScrollPosition, behavior: "instant" });
    }

    const savePosition = () => {
      homeScrollPosition = { left: window.scrollX, top: window.scrollY };
    };

    savePosition();
    window.addEventListener("scroll", savePosition, { passive: true });

    return () => window.removeEventListener("scroll", savePosition);
  }, []);

  return null;
}
