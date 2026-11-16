import type { CSSProperties } from "react";

import { HomeScrollRestoration } from "@/components/home-scroll-restoration";
import { PageTransition } from "@/components/page-transition";
import { PortfolioCard } from "@/components/portfolio-card";
import { RotatingGallery } from "@/components/rotating-gallery";
import { getWeddingForPhoto, portfolioImages, type PhotoId } from "@/lib/portfolio-images";

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

const portfolioTiles: PhotoId[] = [
  "P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "P09", "P10", "P11", "P12", "P13",
];

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

export default function Home() {
  return (
    <PageTransition pageKey="home">
      <main className="home-shell">
        <HomeScrollRestoration />

        <section id="top" className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              <span className="hero-title-desktop">Soft, elegant</span>
              <span className="hero-title-desktop">and full of</span>
              <span className="hero-title-desktop">light.</span>
              <span className="hero-title-mobile">Soft</span>
              <span className="hero-title-mobile">Elegant</span>
              <span className="hero-title-mobile">and full</span>
              <span className="hero-title-mobile">of light.</span>
            </h1>
          </div>

          <RotatingGallery />
        </section>

        <section id="work" className="work-section" aria-labelledby="work-title">
          <div className="work-copy">
            <h2 id="work-title">
              Photographs that blend a modern aesthetic with authentic emotion,
              reminding you both of how it felt and how you felt.
            </h2>
          </div>

          <div className="portfolio-grid">
            {portfolioTiles.map((photoId, index) => {
              const image = portfolioImages[photoId];
              const wedding = getWeddingForPhoto(photoId);
              const layout = portfolioLayouts[index];

              if (!layout) return null;

              const cardStyle: PortfolioCardStyle = {
                "--desktop-align": layout.desktop.align,
                "--desktop-column": layout.desktop.column,
                "--desktop-offset": layout.desktop.offset,
                "--desktop-row": layout.desktop.row,
                "--desktop-width": layout.desktop.width,
                "--mobile-align": layout.mobile.align,
                "--mobile-column": layout.mobile.column,
                "--mobile-offset": layout.mobile.offset,
                "--mobile-row": layout.mobile.row,
                "--mobile-width": layout.mobile.width,
              };

              return (
                <PortfolioCard
                  key={photoId}
                  image={image}
                  photoId={photoId}
                  wedding={wedding ?? undefined}
                  style={cardStyle}
                />
              );
            })}
          </div>
        </section>

      </main>
    </PageTransition>
  );
}
