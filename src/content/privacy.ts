export const privacyDocumentId = "privacyNotice";

type PrivacyLink = { _key: string; _type: "link"; href: string };

export type PrivacyBlock = {
  _key: string;
  _type: "block";
  style: "normal" | "h2";
  children: { _key: string; _type: "span"; text: string; marks: string[] }[];
  markDefs: PrivacyLink[];
};

function privacyBlock(
  key: string,
  style: PrivacyBlock["style"],
  ...parts: (string | { text: string; href: string })[]
): PrivacyBlock {
  const markDefs: PrivacyLink[] = [];
  const children = parts.map((part, index): PrivacyBlock["children"][number] => {
    const _key = `${key}-span-${index}`;
    if (typeof part === "string") return { _key, _type: "span", text: part, marks: [] };

    const linkKey = `${key}-link-${index}`;
    markDefs.push({ _key: linkKey, _type: "link", href: part.href });
    return { _key, _type: "span", text: part.text, marks: [linkKey] };
  });
  return { _key: key, _type: "block", style, children, markDefs };
}

export function getPrivacyLinkHref(value: unknown) {
  if (typeof value !== "string") return undefined;
  const href = value.trim();
  if (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\") && !/[\r\n\t]/.test(href)) {
    return href;
  }
  try {
    const { protocol } = new URL(href);
    return ["https:", "http:", "mailto:"].includes(protocol) ? href : undefined;
  } catch {
    return undefined;
  }
}

export const defaultPrivacyNotice = {
  hidden: false,
  heading: "Privacy notice",
  body: [
    privacyBlock(
      "intro", "normal",
      "PHM Weddings, based in Ljubljana, Slovenia, is responsible for handling the personal data you share through the contact form. For privacy questions or requests, use the contact details in ",
      { text: "Let’s Connect", href: "/#contact" },
      ".",
    ),
    privacyBlock("collection-heading", "h2", "What we collect and why"),
    privacyBlock(
      "collection", "normal",
      "We use your name, email address and anything you include in your message to answer your enquiry, discuss availability and prepare a quote if you request one. For wedding bookings, this is part of taking steps at your request before entering into a contract under Article 6(1)(b) of the GDPR. The form needs your name, email address and message so we can respond.",
    ),
    privacyBlock("recipients-heading", "h2", "Who receives your information"),
    privacyBlock(
      "recipients", "normal",
      "When email delivery is enabled, the form sends your enquiry to PHM Weddings through Resend. Resend stores message and delivery data in the United States. Its ",
      { text: "data processing agreement", href: "https://resend.com/legal/dpa" },
      " includes the EU Standard Contractual Clauses for these transfers.",
    ),
    privacyBlock("retention-heading", "h2", "How long we keep your information"),
    privacyBlock(
      "retention", "normal",
      "We keep enquiries for as long as needed to respond and follow up. If you book with us, we may keep relevant correspondence to provide the agreed services and meet applicable record-keeping obligations.",
    ),
    privacyBlock("rights-heading", "h2", "Your rights"),
    privacyBlock(
      "rights", "normal",
      "Depending on the circumstances, you may ask to access, correct, delete, restrict or receive a copy of your personal data in a portable format. You may also object to processing where that right applies. You can lodge a complaint with the ",
      { text: "Slovenian Information Commissioner", href: "https://www.ip-rs.si/en/data-protection/how-to-file-an-application" },
      " or your local data protection authority.",
    ),
  ],
};
