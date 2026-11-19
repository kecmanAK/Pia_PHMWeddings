import { defineArrayMember, defineField, defineType } from "sanity";

import { defaultHomepageCopy, homepageDocumentId, homepagePhotoIdentity, spherePhotoCount } from "../content/homepage";
import { HomepagePhotoArray, LegacyHomepagePhotoPreview } from "./homepage-photo-picker";
import { SelectablePhotoItem } from "./photo-array-selection";

function uniquePhotos(photos: {
  photoId?: string;
  asset?: { _ref?: string };
  image?: { asset?: { _ref?: string } };
}[] = []) {
  const keys = photos.flatMap((photo) => {
    const key = homepagePhotoIdentity(photo.photoId, photo.asset?._ref ?? photo.image?.asset?._ref);
    return key ? [key] : [];
  });
  return new Set(keys).size === keys.length || "Use each photograph only once in this selection.";
}

export const homepageSchemaTypes = [
  defineType({
    name: homepageDocumentId,
    title: "Homepage",
    type: "document",
    preview: { prepare: () => ({ title: "Homepage" }) },
    fields: [
      defineField({
        name: "sphereHeadline",
        title: "Sphere headline",
        type: "text",
        rows: 4,
        description: "The headline behind the sphere. Use a new line for each line of the headline.",
        initialValue: defaultHomepageCopy.sphereHeadline,
        placeholder: defaultHomepageCopy.sphereHeadline,
      }),
      defineField({
        name: "spherePhotos",
        title: "Sphere photos",
        type: "array",
        components: { input: HomepagePhotoArray },
        options: { disableActions: ["add"] },
        description: `Choose exactly ${spherePhotoCount} photographs for the sphere. Use Choose existing photos to add from the library.`,
        of: [defineArrayMember({ type: "homepageBuiltInPhoto" }), defineArrayMember({ type: "homepagePhoto" })],
        validation: (rule) => rule.required().length(spherePhotoCount).custom(uniquePhotos),
      }),
      defineField({
        name: "stickyText",
        title: "Sticky text below the sphere",
        type: "text",
        rows: 4,
        description: "The text that stays in view while visitors scroll through the homepage photos.",
        initialValue: defaultHomepageCopy.stickyText,
        placeholder: defaultHomepageCopy.stickyText,
      }),
      defineField({
        name: "gridPhotos",
        title: "Photos below the sphere",
        type: "array",
        components: { input: HomepagePhotoArray },
        options: { disableActions: ["add"] },
        description: "Drag photos into order. Use Choose existing photos to add from the library. For a link to a wedding gallery, use Add to homepage in that gallery.",
        of: [
          defineArrayMember({ type: "homepageBuiltInPhoto" }),
          defineArrayMember({ type: "homepagePhoto" }),
          defineArrayMember({ type: "homepageWeddingPhoto" }),
        ],
        validation: (rule) => rule.custom(uniquePhotos),
      }),
    ],
  }),
  defineType({
    name: "homepageBuiltInPhoto",
    title: "Original photo",
    type: "object",
    components: { item: SelectablePhotoItem, preview: LegacyHomepagePhotoPreview },
    fields: [
      defineField({
        name: "photoId",
        title: "Photo",
        type: "string",
        readOnly: true,
        validation: (rule) => rule.required().custom((photoId) => !photoId || Boolean(homepagePhotoIdentity(photoId)) || "Unknown original photograph."),
      }),
    ],
    preview: { select: { title: "photoId" } },
  }),
  defineType({
    name: "homepagePhoto",
    title: "Photo",
    type: "image",
    components: { item: SelectablePhotoItem },
    validation: (rule) => rule.assetRequired(),
    fields: [defineField({ name: "alt", title: "Photo description", type: "string" })],
    preview: { select: { media: "asset", title: "alt" }, prepare: ({ media, title }) => ({ media, title: title || "Photo" }) },
  }),
  defineType({
    name: "homepageWeddingPhoto",
    title: "Wedding photo",
    type: "object",
    components: { item: SelectablePhotoItem },
    description: "Add a wedding photo from the wedding gallery using Add to homepage.",
    fields: [
      defineField({ name: "image", title: "Photo", type: "image", readOnly: true, validation: (rule) => rule.assetRequired() }),
      defineField({ name: "wedding", title: "Wedding gallery", type: "reference", to: [{ type: "wedding" }], weak: true, readOnly: true, validation: (rule) => rule.required() }),
      defineField({ name: "photoKey", type: "string", hidden: true, validation: (rule) => rule.required() }),
    ],
    preview: {
      select: { media: "image.asset", title: "image.alt", subtitle: "wedding.names" },
      prepare: ({ media, title, subtitle }) => ({ media, title: title || "Wedding photo", subtitle }),
    },
  }),
];
