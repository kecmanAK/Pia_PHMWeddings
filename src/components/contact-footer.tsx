import { Suspense } from "react";

import { ContactForm, PrivacyNoticeLink } from "@/components/contact-form";
import { ContactLinks, PublishedContactLinks } from "@/components/contact-links";
import { getPrivacyNotice } from "@/lib/privacy";

async function PublishedPrivacyNoticeLink() {
  const { hidden } = await getPrivacyNotice();
  return hidden ? null : <PrivacyNoticeLink />;
}

export function ContactFooter() {
  return (
    <footer id="contact" className="contact-section" aria-labelledby="contact-title">
      <div className="contact-layout">
        <div className="contact-intro">
          <div className="contact-heading-group">
            <h2 id="contact-title">
              <span>Let’s</span>
              <span>Connect</span>
            </h2>

            <p>Based in Ljubljana, available in Europe.</p>
          </div>

          <div className="contact-links">
            <Suspense fallback={<ContactLinks />}>
              <PublishedContactLinks />
            </Suspense>
          </div>
        </div>

        <ContactForm privacyLink={
          <Suspense fallback={null}>
            <PublishedPrivacyNoticeLink />
          </Suspense>
        } />
      </div>

      <p className="contact-copyright">© 2026 PHM Weddings</p>
    </footer>
  );
}
