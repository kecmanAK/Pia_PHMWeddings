import type { UserViewComponent } from "sanity/structure";

const aboutUrl = new URL("/about", process.env.SANITY_STUDIO_PREVIEW_URL || "http://localhost:3000").href;

export const AboutPagePreview: UserViewComponent = ({ document }) => (
  <iframe
    key={document.published?._rev}
    src={aboutUrl}
    title="Published About page preview"
    style={{ display: "block", width: "100%", height: "100%", border: 0 }}
  />
);
