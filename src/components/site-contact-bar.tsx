"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";

const linkColors = {
  idle: { "--bar-color": "#404040", "--bar-blend-color": "#bfbfbf" },
  hover: { "--bar-color": "#a1a1a1", "--bar-blend-color": "#5e5e5e" },
};

export function SiteContactBarLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <motion.a href={href} initial={false} animate="idle" whileHover="hover" whileFocus="hover" variants={linkColors}>
      {children}
    </motion.a>
  );
}

export function SiteContactBar({ children }: { children: ReactNode }) {
  const [isContactVisible, setIsContactVisible] = useState(false);

  useEffect(() => {
    const contactSection = document.querySelector("#contact");

    if (!contactSection) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsContactVisible(entry.isIntersecting),
      { threshold: 0.01 },
    );

    observer.observe(contactSection);

    return () => observer.disconnect();
  }, []);

  return (
    <motion.aside
      className="site-contact-bar"
      initial={false}
      animate={isContactVisible
        ? { opacity: 0, transitionEnd: { visibility: "hidden" } }
        : { opacity: 1, visibility: "visible" }}
      style={{ pointerEvents: isContactVisible ? "none" : "auto" }}
      inert={isContactVisible}
      aria-label="PHM Weddings on Instagram"
      aria-hidden={isContactVisible}
    >
      {children}
    </motion.aside>
  );
}
