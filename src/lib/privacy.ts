import { cacheLife } from "next/cache";

import { defaultPrivacyNotice, privacyDocumentId, type PrivacyBlock } from "@/content/privacy";
import { queryPublishedSanity } from "@/lib/sanity";

export async function getPrivacyNotice() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });

  const notice = await queryPublishedSanity<{ hidden?: boolean; heading?: string; body?: PrivacyBlock[] } | null>(
    "*[_id == $id && _type == $id][0]{hidden, heading, body}",
    { id: privacyDocumentId },
  );

  return {
    hidden: notice?.hidden === true,
    heading: notice?.heading?.trim() || defaultPrivacyNotice.heading,
    body: notice?.body?.length ? notice.body : defaultPrivacyNotice.body,
  };
}
