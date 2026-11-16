"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { NavbarLink } from "@/components/navbar-link";

function getNavPage(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname === "/work" || pathname.startsWith("/weddings/")) return "work";
  if (pathname === "/about") return "about";
  return null;
}

export function SiteHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const committedPathname = useRef(pathname);
  const isHome = pathname === "/";
  const currentPage = getNavPage(pathname);
  const [navigation, setNavigation] = useState({ source: pathname, target: pathname });
  const [isContactActive, setIsContactActive] = useState(false);

  // Start the same color fade for links and history traversal, before the
  // destination finishes loading. Committing the route must not restart it.
  const selectedPage = getNavPage(navigation.source === pathname ? navigation.target : pathname);
  const contactActive = isContactActive && navigation.target === pathname;

  if (navigation.source !== pathname) {
    setNavigation({ source: pathname, target: pathname });
  }

  const beginNavigation = useCallback((target: string) => {
    setNavigation((current) => ({ ...current, target }));
    setIsContactActive(false);
  }, []);

  useLayoutEffect(() => {
    committedPathname.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const onHistoryNavigation = () => {
      const target = window.location.pathname;
      // Same-page hash history is handled by the contact observer. Resetting
      // it here would discard its state without a new intersection event.
      if (target !== committedPathname.current) {
        beginNavigation(target);
      }
    };

    window.addEventListener("popstate", onHistoryNavigation, true);
    return () => window.removeEventListener("popstate", onHistoryNavigation, true);
  }, [beginNavigation]);

  useEffect(() => {
    const contactSection = document.querySelector("#contact");

    if (!contactSection) {
      return;
    }

    const mobile = window.matchMedia("(max-width: 640px)");
    let observer: IntersectionObserver | undefined;
    let rootMargin = "";

    const observeContact = () => {
      let nextRootMargin = "-45% 0px -45% 0px";
      if (mobile.matches) {
        const headerHeight = headerRef.current?.offsetHeight ?? 0;
        const spaceBelowHeader = Math.max(0, window.innerHeight - headerHeight);
        const bottomInset = Math.floor(Math.min(spaceBelowHeader, contactSection.getBoundingClientRect().height));
        nextRootMargin = `0px 0px -${bottomInset}px 0px`;
      }
      if (rootMargin === nextRootMargin) return;

      rootMargin = nextRootMargin;
      observer?.disconnect();
      observer = new IntersectionObserver(
        ([entry]) => setIsContactActive(entry.isIntersecting),
        { rootMargin },
      );
      observer.observe(contactSection);
    };

    observeContact();
    window.addEventListener("resize", observeContact);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", observeContact);
    };
  }, []);

  return (
    <header ref={headerRef} className="site-header">
      <nav className="primary-nav" aria-label="Primary navigation">
        <NavbarLink
          href="/work"
          prefetch={true}
          onNavigate={() => beginNavigation("/work")}
          active={selectedPage === "work" && !contactActive}
          aria-current={currentPage === "work" && !contactActive ? "page" : undefined}
        >
          Work
        </NavbarLink>
        <NavbarLink
          href="/about"
          prefetch={true}
          onNavigate={() => beginNavigation("/about")}
          active={selectedPage === "about" && !contactActive}
          aria-current={currentPage === "about" && !contactActive ? "page" : undefined}
        >About</NavbarLink>
      </nav>

      <NavbarLink
        className="wordmark"
        href={isHome ? "#top" : "/"}
        scroll={isHome}
        onNavigate={() => beginNavigation("/")}
        active={selectedPage === "home" && !contactActive}
        aria-label="PHM Weddings home"
        aria-current={isHome && !contactActive ? "page" : undefined}
      >
        PHM Weddings
      </NavbarLink>

      <NavbarLink
        className="enquire-link"
        href="#contact"
        active={contactActive}
        aria-current={contactActive ? "location" : undefined}
      >
        Enquire
        <svg
          className="enquire-icon"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </svg>
      </NavbarLink>
    </header>
  );
}
