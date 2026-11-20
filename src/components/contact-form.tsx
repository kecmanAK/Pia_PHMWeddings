"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";

import { contactFieldLimits } from "@/content/contact";

const MotionLink = motion.create(Link);

const fieldMotion = {
  initial: false as const,
  animate: { borderColor: "#e5e5e5" },
  whileFocus: { borderColor: "#404040" },
};

export function PrivacyNoticeLink() {
  return (
    <p>
      <MotionLink
        className="contact-privacy-link"
        href="/privacy"
        initial={false}
        animate={{ color: "#404040" }}
        whileHover={{ color: "#a1a1a1" }}
        whileFocus={{ color: "#a1a1a1" }}
      >
        Privacy notice
      </MotionLink>
    </p>
  );
}

export function ContactForm({ privacyLink }: { privacyLink: ReactNode }) {
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const buttonHover = pending ? undefined : { backgroundColor: "#f5f5f5" };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    submitting.current = true;
    setPending(true);
    setFeedback("");

    try {
      const response = await fetch(form.action, { method: "POST", body: data });
      if (response.ok) {
        form.reset();
        setFeedback("Thank you! Your message was sent.");
      } else if (response.status === 400) {
        setFeedback("Please check your name, email address and message.");
      } else {
        setFeedback("Your message could not be sent. Please try again later.");
      }
    } catch {
      setFeedback("Your message could not be sent. Please try again later.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form className="contact-form" action="/api/contact" method="post" onSubmit={submit} aria-busy={pending}>
      <label>
        <span>Name *</span>
        <motion.input {...fieldMotion} name="name" autoComplete="name" required maxLength={contactFieldLimits.name} readOnly={pending} />
      </label>

      <label>
        <span>Email address *</span>
        <motion.input {...fieldMotion} name="email" type="email" autoComplete="email" required maxLength={contactFieldLimits.email} readOnly={pending} />
      </label>

      <div className="contact-form-message">
        <label>
          <span>Message *</span>
          <motion.textarea {...fieldMotion} name="message" required maxLength={contactFieldLimits.message} readOnly={pending} />
        </label>
        <p className="contact-form-feedback" role="status">{feedback}</p>
      </div>

      <input type="text" name="website" aria-label="Website" autoComplete="off" tabIndex={-1} hidden />

      <div className="contact-form-actions">
        <motion.button
          type="submit"
          disabled={pending}
          initial={false}
          animate={{ backgroundColor: "#ffffff" }}
          whileHover={buttonHover}
          whileFocus={buttonHover}
        >
          {pending ? "Sending…" : "Send message"}
        </motion.button>
        <div className="contact-form-details">{privacyLink}</div>
      </div>
    </form>
  );
}
