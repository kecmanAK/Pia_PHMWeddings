import { createHash } from "node:crypto";

import { contactFieldLimits, isContactEmail } from "@/content/contact";
import { readContactSettings } from "@/lib/contact";

function textField(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ ok: false }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (textField(form, "website")) return Response.json({ ok: true });

  const name = textField(form, "name");
  const email = textField(form, "email");
  const message = textField(form, "message");
  if (!name || name.length > contactFieldLimits.name || !isContactEmail(email) ||
      !message || message.length > contactFieldLimits.message) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const sender = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !sender) return Response.json({ ok: false }, { status: 503 });

  const { email: recipient } = await readContactSettings();
  if (!recipient) return Response.json({ ok: false }, { status: 503 });

  const body = JSON.stringify({
    from: sender,
    to: [recipient],
    reply_to: email,
    subject: "Wedding enquiry from the PHM Weddings website",
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });
  const idempotencyKey = createHash("sha256").update(body).digest("hex");

  try {
    const delivery = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `contact/${idempotencyKey}`,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    if (delivery.ok) return Response.json({ ok: true });
    console.warn(`Contact email delivery failed (HTTP ${delivery.status}).`);
  } catch {
    console.warn("Could not reach the contact email service.");
  }

  return Response.json({ ok: false }, { status: 502 });
}
