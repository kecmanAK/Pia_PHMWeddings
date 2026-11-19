import { Suspense, cache, type CSSProperties } from "react";

import { HomeScrollRestoration } from "@/components/home-scroll-restoration";
import { PageTransition } from "@/components/page-transition";
import { PortfolioCard } from "@/components/portfolio-card";
import { RotatingGallery } from "@/components/rotating-gallery";
import { defaultHomepageCopy, defaultMobileSphereLines } from "@/content/homepage";
import { getHomepageContent } from "@/lib/homepage";

type PortfolioLayout = {
  desktop: {
    align: "center" | "end" | "start";
    column: string;
    offset: string;
    row: number;
    width: string;
  };
  mobile: {
    align: "center" | "end" | "start";
    column: string;
    offset: string;
    row: number;
    width: string;
  };
};

type PortfolioCardStyle = CSSProperties & {
  "--desktop-align": string;
  "--desktop-column": string;
  "--desktop-offset": string;
  "--desktop-row": number;
  "--desktop-width": string;
  "--mobile-align": string;
  "--mobile-column": string;
  "--mobile-offset": string;
  "--mobile-row": number;
  "--mobile-width": string;
};

const portfolioLayouts: PortfolioLayout[] = [
  {
    desktop: { align: "start", column: "1 / 5", offset: "0rem", row: 1, width: "100%" },
    mobile: { align: "start", column: "1 / 4", offset: "0rem", row: 1, width: "92%" },
  },
  {
    desktop: { align: "end", column: "8 / 13", offset: "11rem", row: 1, width: "88%" },
    mobile: { align: "end", column: "4 / 7", offset: "8rem", row: 1, width: "100%" },
  },
  {
    desktop: { align: "center", column: "3 / 6", offset: "4rem", row: 2, width: "100%" },
    mobile: { align: "start", column: "1 / 4", offset: "2rem", row: 2, width: "74%" },
  },
  {
    desktop: { align: "end", column: "9 / 13", offset: "0rem", row: 2, width: "80%" },
    mobile: { align: "end", column: "4 / 7", offset: "10rem", row: 2, width: "88%" },
  },
  {
    desktop: { align: "start", column: "1 / 6", offset: "9rem", row: 3, width: "84%" },
    mobile: { align: "start", column: "1 / 4", offset: "7rem", row: 3, width: "100%" },
  },
  {
    desktop: { align: "center", column: "7 / 10", offset: "0rem", row: 3, width: "100%" },
    mobile: { align: "end", column: "4 / 7", offset: "0rem", row: 3, width: "70%" },
  },
  {
    desktop: { align: "end", column: "9 / 13", offset: "8rem", row: 4, width: "100%" },
    mobile: { align: "center", column: "1 / 4", offset: "0rem", row: 4, width: "86%" },
  },
  {
    desktop: { align: "start", column: "2 / 5", offset: "0rem", row: 4, width: "78%" },
    mobile: { align: "end", column: "4 / 7", offset: "9rem", row: 4, width: "100%" },
  },
  {
    desktop: { align: "center", column: "5 / 9", offset: "3rem", row: 5, width: "100%" },
    mobile: { align: "start", column: "1 / 4", offset: "5rem", row: 5, width: "72%" },
  },
  {
    desktop: { align: "end", column: "10 / 13", offset: "0rem", row: 5, width: "86%" },
    mobile: { align: "end", column: "4 / 7", offset: "0rem", row: 5, width: "94%" },
  },
  {
    desktop: { align: "start", column: "1 / 5", offset: "10rem", row: 6, width: "92%" },
    mobile: { align: "start", column: "1 / 4", offset: "0rem", row: 6, width: "100%" },
  },
  {
    desktop: { align: "end", column: "8 / 13", offset: "0rem", row: 6, width: "80%" },
    mobile: { align: "end", column: "4 / 7", offset: "7rem", row: 6, width: "78%" },
  },
  {
    desktop: { align: "center", column: "3 / 6", offset: "0rem", row: 7, width: "72%" },
    mobile: { align: "center", column: "1 / 4", offset: "8rem", row: 7, width: "84%" },
  },
];

const portfolioLayoutRows = Math.max(...portfolioLayouts.map(({ desktop, mobile }) => Math.max(desktop.row, mobile.row)));

const readHomepageContent = cache(getHomepageContent);

function SphereHeadline({ text }: { text: string }) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const custom = text !== defaultHomepageCopy.sphereHeadline;
  const mobileLines = custom ? lines : defaultMobileSphereLines;

  return (
    <div className="hero-copy">
      <h1
        id="hero-title"
        aria-label={lines.join(" ")}
        data-custom-headline={custom || undefined}
        style={custom ? { "--headline-height-ratio": lines.length * 1.3 } as CSSProperties : undefined}
      >
        {lines.map((line, index) => <span key={index} className="hero-title-desktop">{line}</span>)}
        {mobileLines.map((line, index) => <span key={index} className="hero-title-mobile">{line}</span>)}
      </h1>
    </div>
  );
}

async function HomepageHero() {
  const { sphere, sphereHeadline } = await readHomepageContent();
  return (
    <>
      <SphereHeadline text={sphereHeadline} />
      {sphere.length > 0 && <RotatingGallery key={JSON.stringify(sphere)} photos={sphere} />}
    </>
  );
}

async function HomepageStickyText() {
  const { stickyText } = await readHomepageContent();
  return <h2 id="work-title">{stickyText}</h2>;
}

async function HomepagePortfolio() {
  const { grid } = await readHomepageContent();

  return grid.map(({ id, image, wedding }, index) => {
    const layout = portfolioLayouts[index % portfolioLayouts.length];
    const rowOffset = Math.floor(index / portfolioLayouts.length) * portfolioLayoutRows;

    const cardStyle: PortfolioCardStyle = {
      "--desktop-align": layout.desktop.align,
      "--desktop-column": layout.desktop.column,
      "--desktop-offset": layout.desktop.offset,
      "--desktop-row": layout.desktop.row + rowOffset,
      "--desktop-width": layout.desktop.width,
      "--mobile-align": layout.mobile.align,
      "--mobile-column": layout.mobile.column,
      "--mobile-offset": layout.mobile.offset,
      "--mobile-row": layout.mobile.row + rowOffset,
      "--mobile-width": layout.mobile.width,
    };

    return (
      <PortfolioCard
        key={id}
        image={image}
        photoId={id}
        wedding={wedding}
        style={cardStyle}
      />
    );
  });
}

export default function Home() {
  return (
    <PageTransition pageKey="home">
      <main className="home-shell">
        <HomeScrollRestoration />

        <section id="top" className="hero" aria-labelledby="hero-title">
          <Suspense fallback={<SphereHeadline text={defaultHomepageCopy.sphereHeadline} />}>
            <HomepageHero />
          </Suspense>
        </section>

        <section id="work" className="work-section" aria-labelledby="work-title">
          <div className="work-copy">
            <Suspense fallback={<h2 id="work-title">{defaultHomepageCopy.stickyText}</h2>}>
              <HomepageStickyText />
            </Suspense>
          </div>

          <div className="portfolio-grid">
            <Suspense fallback={<span className="sr-only" role="status">Loading portfolio photographs…</span>}>
              <HomepagePortfolio />
            </Suspense>
          </div>
        </section>

      </main>
    </PageTransition>
  );
}
