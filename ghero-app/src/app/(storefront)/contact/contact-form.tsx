"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errorMessage, fieldErrors } from "@/lib/api-client";

const input = "w-full border border-gray-300 px-4 py-3 focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-white";

export function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues({ ...values, [k]: e.target.value });

  if (status === "sent") {
    return (
      <div role="status" className="p-6 bg-white border border-green-200 flex gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
        <div>
          <p className="font-heading text-xl text-charcoal mb-1">Thank you!</p>
          <p className="text-gray-600">Your message has been sent. We usually reply within one working day.</p>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus("sending");
        setErrors({});
        setError(null);
        try {
          await api("/api/contact", { body: values });
          setStatus("sent");
        } catch (err) {
          setErrors(fieldErrors(err));
          setError(errorMessage(err));
          setStatus("idle");
        }
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="ct-name" className="block text-sm text-gray-700 mb-2">
            Name
          </label>
          <input id="ct-name" required autoComplete="name" value={values.name} onChange={set("name")} className={input} />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="ct-email" className="block text-sm text-gray-700 mb-2">
            Email
          </label>
          <input id="ct-email" type="email" required autoComplete="email" value={values.email} onChange={set("email")} className={input} />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="ct-phone" className="block text-sm text-gray-700 mb-2">
          Phone <span className="text-gray-400">(optional)</span>
        </label>
        <input id="ct-phone" type="tel" autoComplete="tel-national" value={values.phone} onChange={set("phone")} className={input} />
        {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
      </div>
      <div>
        <label htmlFor="ct-message" className="block text-sm text-gray-700 mb-2">
          Message
        </label>
        <textarea id="ct-message" required rows={5} value={values.message} onChange={set("message")} className={`${input} resize-none`} />
        {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message}</p>}
      </div>
      {/* Honeypot for bots: hidden from people and assistive tech. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} className="hidden" aria-hidden />
      {error && !Object.keys(errors).length && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" isLoading={status === "sending"} className="uppercase tracking-wider rounded-none">
        Send Message
      </Button>
    </form>
  );
}
