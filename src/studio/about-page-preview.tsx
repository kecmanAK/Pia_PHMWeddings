import { useEffect, useRef, useState } from "react";
import type { UserViewComponent } from "sanity/structure";

import { aboutPreviewReady, aboutPreviewUpdate } from "../content/about";

const previewUrl = new URL("/about/preview", process.env.SANITY_STUDIO_PREVIEW_URL || "http://localhost:3000");
const previewDevices = ["Desktop", "Mobile"] as const;

export const AboutPagePreview: UserViewComponent = ({ document }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<(typeof previewDevices)[number]>(previewDevices[0]);
  const isMobile = device === "Mobile";
  const { biography, portrait } = document.displayed as {
    biography?: string;
    portrait?: { alt?: string; asset?: { _ref?: string } };
  };
  const portraitRef = portrait?.asset?._ref;
  const portraitAlt = portrait?.alt;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const sendDraft = () => frame.contentWindow?.postMessage({
      type: aboutPreviewUpdate,
      biography: typeof biography === "string" ? biography : "",
      portraitRef: typeof portraitRef === "string" ? portraitRef : "",
      portraitAlt: typeof portraitAlt === "string" ? portraitAlt : "",
    }, previewUrl.origin);

    const onMessage = (event: MessageEvent) => {
      if (event.source === frame.contentWindow && event.origin === previewUrl.origin && event.data === aboutPreviewReady) {
        sendDraft();
      }
    };

    window.addEventListener("message", onMessage);
    sendDraft();
    return () => window.removeEventListener("message", onMessage);
  }, [biography, portraitRef, portraitAlt]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div role="group" aria-label="Preview device" style={{ display: "flex", justifyContent: "center", gap: 8, padding: 8 }}>
        {previewDevices.map((option) => {
          const selected = device === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => setDevice(option)}
              style={{
                padding: "6px 12px",
                border: "1px solid var(--card-border-color, #b5b5b5)",
                borderRadius: 4,
                background: selected ? "var(--card-fg-color, #242424)" : "transparent",
                color: selected ? "var(--card-bg-color, #fff)" : "inherit",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
      <iframe
        ref={frameRef}
        src={previewUrl.href}
        referrerPolicy="origin"
        sandbox="allow-scripts allow-same-origin"
        title={`About page draft preview · ${device}`}
        style={{
          display: "block",
          flex: "1 1 0",
          alignSelf: "center",
          width: "100%",
          minHeight: 0,
          maxWidth: isMobile ? 390 : undefined,
          maxHeight: isMobile ? 844 : undefined,
          border: 0,
        }}
      />
    </div>
  );
};
