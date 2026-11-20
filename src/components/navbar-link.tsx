"use client";

import Link from "next/link";
import { animate, type AnimationPlaybackControls } from "motion";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";

import { interactionDuration } from "@/lib/motion";

const colors = {
  idle: { "--nav-color": "#a1a1a1", "--nav-blend-color": "#5e5e5e" },
  active: { "--nav-color": "#404040", "--nav-blend-color": "#bfbfbf" },
};

export function NavbarLink({ active, palette = colors, ...props }: ComponentProps<typeof Link> & {
  active: boolean;
  palette?: typeof colors;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reducedMotion = useReducedMotion();
  const activeRef = useRef(active);
  const hovered = useRef(false);
  const focused = useRef(false);
  const target = useRef(active);
  const animation = useRef<AnimationPlaybackControls | null>(null);
  const [initialColors] = useState(() => palette[active ? "active" : "idle"] as CSSProperties);

  // One animation path for navigation, hover, focus and contact-section changes.
  // Start directly so every interaction uses the same timing.
  const updateColor = useCallback(() => {
    if (!ref.current) return;
    const next = activeRef.current || hovered.current || focused.current;
    if (next === target.current) return;
    target.current = next;
    animation.current?.stop();
    animation.current = animate(ref.current, palette[next ? "active" : "idle"], {
      duration: reducedMotion ? 0 : interactionDuration,
      ease: "easeOut",
    });
  }, [palette, reducedMotion]);

  useLayoutEffect(() => {
    activeRef.current = active;
    updateColor();
  }, [active, updateColor]);

  useEffect(() => () => animation.current?.stop(), []);

  return (
    <Link
      {...props}
      ref={ref}
      style={initialColors}
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        hovered.current = true;
        updateColor();
      }}
      onPointerLeave={() => {
        hovered.current = false;
        updateColor();
      }}
      onFocus={(event) => {
        focused.current = event.currentTarget.matches(":focus-visible");
        updateColor();
      }}
      onBlur={() => {
        focused.current = false;
        updateColor();
      }}
    />
  );
}
