import { defineArrayMember, defineConfig, defineField, defineType } from "sanity";
import { structureTool } from "sanity/structure";

import { aboutDocumentId, defaultAboutBiography } from "./src/content/about";
import { contactDocumentId, getInstagramHandle, isContactEmail } from "./src/content/contact";
import { homepageDocumentId } from "./src/content/homepage";
import { defaultPrivacyNotice, getPrivacyLinkHref, privacyDocumentId } from "./src/content/privacy";
import { workOrderDocumentId } from "./src/content/work-order";
import { GalleryPhotoInput } from "./src/studio/add-to-homepage";
import { AboutPagePreview } from "./src/studio/about-page-preview";
import { homepageSchemaTypes } from "./src/studio/homepage-schema";
import { SelectablePhotoArray, SelectablePhotoItem } from "./src/studio/photo-array-selection";
import { workOrderSchema } from "./src/studio/work-order";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;

if (!projectId || !dataset) {
  throw new Error("Set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET in .env.local to use Sanity Studio.");
}

export default defineConfig({
  title: "PHM Weddings",
  projectId,
  dataset,
  plugins: [structureTool({
    structure: (builder) => {
      const list = builder.defaults();
      const about = builder.document().singleton(aboutDocumentId).views([
        builder.view.form().id("form"),
        builder.view.component(AboutPagePreview).id("preview").title("Page preview"),
      ]);
      const workOrder = builder.document().singleton(workOrderDocumentId).child((id, { params }) =>
        builder.document().schemaType("wedding").documentId(id).initialValueTemplate(params.template ?? "wedding"),
      );
      const wedding = {
        ...workOrder.serialize(),
        canHandleIntent: (intent, { type }) => type === "wedding" && (intent === "edit" || intent === "create"),
      };

      return list.items(list.getItems().filter((item) => item.getId() !== workOrderDocumentId).map((item) => {
        if (item.getId() === aboutDocumentId) return item.child(about);
        if (item.getId() === "wedding") return item.child(wedding);
        return item;
      }));
    },
  })],
  schema: {
    types: [
      ...homepageSchemaTypes,
      workOrderSchema,
      defineType({
        name: aboutDocumentId,
        title: "About page",
        type: "document",
        preview: {
          select: { media: "portrait" },
          prepare: ({ media }) => ({ title: "About page", media }),
        },
        fields: [
          defineField({
            name: "biography",
            title: "Biography",
            type: "text",
            rows: 18,
            description: "Leave a blank line between paragraphs. The website adds the spacing.",
            initialValue: defaultAboutBiography,
            validation: (rule) => rule.required().custom((value) =>
              value?.trim() ? true : "Enter a biography.",
            ),
          }),
          defineField({
            name: "portrait",
            title: "Portrait photo",
            type: "image",
            description: "Choose the portrait shown on the About page.",
            validation: (rule) => rule.assetRequired(),
            fields: [
              defineField({
                name: "alt",
                title: "Photo description",
                type: "string",
                description: "Optional description for visitors using a screen reader.",
              }),
            ],
          }),
        ],
      }),
      defineType({
        name: contactDocumentId,
        title: "Contact",
        type: "document",
        fields: [
          defineField({
            name: "email",
            title: "Contact email",
            type: "string",
            description: "Shown on the website and used to receive enquiries from the contact form.",
            validation: (rule) => rule.custom((value) =>
              !value?.trim() || isContactEmail(value.trim()) || "Enter a valid email address.",
            ),
          }),
          defineField({
            name: "instagram",
            title: "Instagram username",
            type: "string",
            description: "Enter a username such as @phmweddings to update the Instagram links on the website.",
            validation: (rule) => rule.custom((value) =>
              !value?.trim() || Boolean(getInstagramHandle(value)) || "Enter an Instagram username with letters, numbers, periods or underscores.",
            ),
          }),
        ],
      }),
      defineType({
        name: privacyDocumentId,
        title: "Privacy notice",
        type: "document",
        initialValue: defaultPrivacyNotice,
        preview: { select: { title: "heading" } },
        fields: [
          defineField({
            name: "hidden",
            title: "Hide privacy notice",
            type: "boolean",
            description: "Publish with this switch on to hide the footer link and close the /privacy page. Turn it off and publish to restore both.",
          }),
          defineField({
            name: "heading",
            title: "Page title",
            type: "string",
            validation: (rule) => rule.required().custom((value) =>
              Boolean(value?.trim()) || "Enter a page title.",
            ),
          }),
          defineField({
            name: "body",
            title: "Privacy text",
            type: "array",
            description: "Edit the text displayed at /privacy. Select a link, such as Let’s Connect, to edit its destination.",
            validation: (rule) => rule.required().custom((blocks) =>
              Boolean(blocks?.some((block) => block.children?.some((span) => span.text?.trim()))) || "Enter the privacy notice.",
            ),
            of: [defineArrayMember({
              type: "block",
              styles: [{ title: "Normal", value: "normal" }, { title: "Heading", value: "h2" }],
              lists: [],
              marks: {
                decorators: [],
                annotations: [defineArrayMember({
                  name: "link",
                  title: "Link",
                  type: "object",
                  fields: [defineField({
                    name: "href",
                    title: "Link destination",
                    type: "string",
                    description: "Use a site path such as /#contact, a full website URL or a mailto: link.",
                    validation: (rule) => rule.required().custom((value) =>
                      Boolean(getPrivacyLinkHref(value)) || "Enter a site path, website URL or mailto: link.",
                    ),
                  })],
                })],
              },
            })],
          }),
        ],
      }),
      defineType({
        name: "wedding",
        title: "Wedding",
        type: "document",
        initialValue: { showReviewOnWork: true },
        fields: [
          defineField({
            name: "names",
            title: "Couple names",
            type: "string",
            validation: (rule) => rule.required().custom((value) => !!value?.trim() || "Enter the couple’s names."),
          }),
          defineField({
            name: "slug",
            title: "Gallery URL slug",
            type: "slug",
            description: "Generate this from the couple’s names. Keep it the same after publishing so existing links keep working.",
            options: { source: "names" },
            validation: (rule) => rule.required().custom((value) =>
              /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value?.current ?? "") || "Use lowercase letters, numbers, and hyphens.",
            ),
          }),
          defineField({
            name: "venue",
            title: "Venue",
            type: "string",
          }),
          defineField({ name: "testimonial", title: "Testimonial", type: "text", rows: 4 }),
          defineField({
            name: "showReviewOnWork",
            title: "Show review on Work",
            type: "boolean",
            description: "Turn this off to show the testimonial only in the wedding gallery.",
          }),
          defineField({
            name: "photos",
            title: "Gallery photos",
            type: "array",
            components: { input: SelectablePhotoArray },
            description: "Add the gallery photos in order. Open exactly four photos and turn on Work highlight.",
            of: [defineArrayMember({
              name: "galleryPhoto",
              title: "Gallery photo",
              type: "image",
              components: { input: GalleryPhotoInput, item: SelectablePhotoItem },
              validation: (rule) => rule.required().assetRequired(),
              fields: [
                defineField({
                  name: "alt",
                  title: "Photo description",
                  type: "string",
                  description: "Optional. A short description helps visitors using a screen reader.",
                }),
                defineField({ name: "highlight", title: "Work highlight", type: "boolean" }),
              ],
              preview: {
                select: { title: "alt", media: "asset", highlight: "highlight" },
                prepare: ({ title, media, highlight }) => ({
                  title: title || "Gallery photo",
                  subtitle: highlight ? "Work highlight" : undefined,
                  media,
                }),
              },
            })],
            validation: (rule) => rule.required().min(4).custom((photos = []) => {
              const assets = photos.flatMap((photo) => photo.asset?._ref ? [photo.asset._ref] : []);
              if (new Set(assets).size !== assets.length) return "Add each photo only once.";
              return photos.filter((photo) => photo.highlight).length === 4 || "Mark exactly four photos as Work highlights.";
            }),
          }),
        ],
        preview: { select: { title: "names", subtitle: "venue", media: "photos.0" } },
      }),
    ],
  },
  document: { singletons: [homepageDocumentId, aboutDocumentId, contactDocumentId, privacyDocumentId, workOrderDocumentId] },
});
