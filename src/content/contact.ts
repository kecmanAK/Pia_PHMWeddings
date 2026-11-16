export const contactDocumentId = "contactSettings";
export const defaultInstagramHandle = "phmweddings";

export const contactFieldLimits = { name: 120, email: 254, message: 5000 };

export function isContactEmail(value: string) {
  return value.length <= contactFieldLimits.email &&
    /^[^\s@<>,;]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(value);
}

export function getInstagramHandle(value: string) {
  const handle = value.trim().replace(/^@/, "");
  return handle.length <= 30 && /^[a-z0-9_]+(?:\.[a-z0-9_]+)*$/i.test(handle) ? handle : undefined;
}
