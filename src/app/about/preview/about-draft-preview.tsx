"use client";

import { useEffect, useState } from "react";

import { aboutPreviewReady, aboutPreviewUpdate, type AboutPortrait } from "@/content/about";

import { AboutContent } from "../about-content";

function getDraftPortrait(assetRef: string, alt: string, imagePath?: string): AboutPortrait | undefined {
  const asset = /^image-([a-zA-Z0-9]+)-([1-9]\d*)x([1-9]\d*)-([a-z0-9]+)$/.exec(assetRef);
  if (!asset || !imagePath) return undefined;

  const [, name, width, height, format] = asset;
  if (!Number.isSafeInteger(Number(width)) || !Number.isSafeInteger(Number(height))) return undefined;

  return {
    src: `https://cdn.sanity.io${imagePath}${name}-${width}x${height}.${format}`,
    alt: alt.trim() || "Portrait of Pia",
    width: Number(width),
    height: Number(height),
  };
}

export function AboutDraftPreview({ imagePath }: { imagePath?: string }) {
  const [content, setContent] = useState<{ biography: string; portrait?: AboutPortrait }>();

  useEffect(() => {
    if (window.parent === window || !document.referrer) return;
    const studioOrigin = new URL(document.referrer).origin;
    if (studioOrigin === "null") return;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== studioOrigin) return;
      const draft = event.data;
      if (draft?.type !== aboutPreviewUpdate || typeof draft.biography !== "string" ||
          typeof draft.portraitRef !== "string" || typeof draft.portraitAlt !== "string") return;

      setContent({
        biography: draft.biography.trim(),
        portrait: getDraftPortrait(draft.portraitRef, draft.portraitAlt, imagePath),
      });
    };

    window.addEventListener("message", onMessage);
    window.parent.postMessage(aboutPreviewReady, studioOrigin);
    return () => window.removeEventListener("message", onMessage);
  }, [imagePath]);

  return content
    ? <AboutContent {...content} />
    : <p role="status" className="px-4 pt-24">Open this preview from Sanity Studio to see your edits.</p>;
}
