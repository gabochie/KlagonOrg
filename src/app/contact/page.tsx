"use client";

import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button, Input } from "@/components/ui";
import { Mail, MapPin, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { submitContact } from "@/lib/forms";
import { Turnstile } from "@/components/Turnstile";
import { verifyTurnstile } from "@/lib/turnstile";

const SUBJECTS = [
  "General Inquiry",
  "Partnership",
  "Volunteer",
  "Sponsorship",
  "Media & Press",
  "Other",
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) return setError("Please complete the human check before sending.");
    setSending(true);
    const check = await verifyTurnstile(token);
    if (!check.success) {
      setSending(false);
      return setError(check.error ?? "Human check failed. Please try again.");
    }
    const { error: err } = await submitContact({
      ...form,
      full_name: form.full_name || null,
      phone: form.phone || null,
      subject: form.subject || null,
    });
    setSending(false);
    if (err) return setError(err);
    setSubmitted(true);
  };

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Contact Us
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            We&apos;d love to hear from you.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Questions, partnerships, volunteer inquiries, or just to say hello — reach out and
            we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] gap-8 items-start">
            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-border p-6 sm:p-8">
              <h2 className="text-base font-extrabold text-navy mb-6">Get in touch</h2>
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pale flex items-center justify-center flex-shrink-0">
                    <Mail size="16" className="text-navy" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-navy">Email</div>
                    <a href="mailto:hello@klagon.org" suppressHydrationWarning className="text-xs text-gray hover:text-amber transition-colors">
                      hello@klagon.org
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pale flex items-center justify-center flex-shrink-0">
                    <Phone size="16" className="text-navy" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-navy">Phone</div>
                    <a href="tel:+233559624456" className="text-xs text-gray hover:text-amber transition-colors">
                      055 962 4456
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pale flex items-center justify-center flex-shrink-0">
                    <MapPin size="16" className="text-navy" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-navy">Location</div>
                    <div className="text-xs text-gray">
                      Community Center, Klagon<br />Greater Accra Region, Ghana
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-border mt-6 pt-6">
                <h3 className="text-xs font-bold text-navy mb-3">Connect online</h3>
                <div className="flex flex-col gap-2.5">
                  {[
                    { icon: <MessageCircle size="16" />, label: "WhatsApp", href: "https://wa.me/233559624456" },
                    { icon: <ExternalLink size="16" />, label: "YouTube", href: "https://www.youtube.com/@KlagonOrg" },
                    { icon: <ExternalLink size="16" />, label: "TikTok", href: "https://www.tiktok.com/@klagonorg" },
                    { icon: <ExternalLink size="16" />, label: "Instagram", href: "https://instagram.com/klagonorg" },
                    { icon: <ExternalLink size="16" />, label: "Facebook", href: "https://facebook.com/klagonorg" },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-gray hover:text-amber transition-colors"
                    >
                      {s.icon}
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl border border-border p-6 sm:p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3">✉️</div>
                  <h3 className="text-base font-bold text-navy mb-1">Message sent!</h3>
                  <p className="text-sm text-gray">
                    We&apos;ll get back to you within 24 hours. Thank you for reaching out.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-base font-extrabold text-navy mb-6">Send us a message</h2>
                  <form
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmit}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Full name" placeholder="Your name" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
                      <Input label="Phone" placeholder="0244 000 000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <Input label="Email" type="email" placeholder="you@email.com" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-navy">Subject</label>
                      <select
                        className="px-3 py-2 rounded-lg border border-border text-sm text-navy font-sans bg-white focus:outline-2 focus:outline-amber focus:border-transparent"
                        required
                        value={form.subject}
                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      >
                        <option value="">Select a topic</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-navy">Message</label>
                      <textarea
                        className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent resize-none h-28"
                        placeholder="Tell us how we can help..."
                        required
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      />
                    </div>
                    {error && <p className="text-xs text-red font-semibold bg-red/5 rounded-lg px-3 py-2">{error}</p>}
                    <Turnstile onToken={setToken} />
                    <Button variant="dark" size="lg" className="w-full" disabled={sending}>
                      {sending ? "Sending…" : "Send Message"}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
