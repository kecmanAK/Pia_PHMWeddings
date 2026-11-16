import * as motion from "motion/react-client";

import { SiteContactBarLink } from "@/components/site-contact-bar";
import { defaultInstagramHandle } from "@/content/contact";
import { getContactSettings } from "@/lib/contact";

function FooterContactLink({ label, href, text }: { label: string; href: string; text: string }) {
  return (
    <div>
      <p>{label}</p>
      <motion.a
        href={href}
        initial={false}
        animate={{ color: "#404040" }}
        whileHover={{ color: "#a1a1a1" }}
        whileFocus={{ color: "#a1a1a1" }}
      >
        {text}
      </motion.a>
    </div>
  );
}

export function ContactLinks({ inBar = false, email, instagram = defaultInstagramHandle }: {
  inBar?: boolean;
  email?: string;
  instagram?: string;
}) {
  const instagramUrl = `https://www.instagram.com/${instagram}/`;
  const instagramText = `@${instagram}`;
  const emailLink = email && {
    href: `mailto:${encodeURIComponent(email).replace("%40", "@")}`,
    text: email,
  };

  if (inBar) {
    return (
      <>
        <SiteContactBarLink href={instagramUrl}>{instagramText}</SiteContactBarLink>
        <p>Ljubljana&nbsp;&nbsp;•&nbsp;&nbsp;Europe</p>
        {emailLink && <SiteContactBarLink href={emailLink.href}>{emailLink.text}</SiteContactBarLink>}
      </>
    );
  }

  return (
    <>
      {emailLink && <FooterContactLink label="Email" {...emailLink} />}
      <FooterContactLink label="Instagram" href={instagramUrl} text={instagramText} />
    </>
  );
}

export async function PublishedContactLinks({ inBar = false }: { inBar?: boolean }) {
  const settings = await getContactSettings();
  return <ContactLinks {...settings} inBar={inBar} />;
}
