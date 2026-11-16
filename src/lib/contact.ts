import { cacheLife } from "next/cache";

import { contactDocumentId, getInstagramHandle, isContactEmail } from "@/content/contact";
import { queryPublishedSanity } from "@/lib/sanity";

export async function readContactSettings() {
  const contact = await queryPublishedSanity<{ email?: unknown; instagram?: unknown } | null>(
    "*[_id == $id && _type == $id][0]{email, instagram}",
    { id: contactDocumentId },
  );
  const email = typeof contact?.email === "string" ? contact.email.trim() : "";
  return {
    email: isContactEmail(email) ? email : undefined,
    instagram: typeof contact?.instagram === "string" ? getInstagramHandle(contact.instagram) : undefined,
  };
}

export async function getContactSettings() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
  return readContactSettings();
}
