import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageTransition } from "@/components/page-transition";
import { getPrivacyLinkHref } from "@/content/privacy";
import { getPrivacyNotice } from "@/lib/privacy";

import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy notice — PHM Weddings",
  description: "How PHM Weddings handles personal data when you send a wedding enquiry.",
};

export const instant = false;

export default async function PrivacyPage() {
  const { hidden, heading, body } = await getPrivacyNotice();
  if (hidden) notFound();

  return (
    <PageTransition pageKey="privacy">
      <main className={styles.page}>
        <h1>{heading}</h1>
        {body.map((block) => {
          const Tag = block.style === "h2" ? "h2" : "p";

          return (
            <Tag key={block._key}>
              {block.children.map((span) => {
                const link = block.markDefs?.find((mark) => mark._type === "link" && span.marks?.includes(mark._key));
                const href = getPrivacyLinkHref(link?.href);

                if (!href) return span.text;
                if (href.startsWith("/")) return <Link key={span._key} href={href}>{span.text}</Link>;
                return <a key={span._key} href={href}>{span.text}</a>;
              })}
            </Tag>
          );
        })}
      </main>
    </PageTransition>
  );
}
