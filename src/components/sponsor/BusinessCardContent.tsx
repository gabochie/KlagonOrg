import Link from "next/link";
import { Phone, Mail, Globe, MapPin, MessageSquareQuote, Star } from "lucide-react";
import { fetchSponsorByCardSlug, parseContact, parseLocation } from "@/lib/sponsors";

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function TapAction({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub?: string;
}) {
  if (href === "#") return null;
  const isHttp = href.startsWith("http");
  return (
    <a
      href={href}
      target={isHttp ? "_blank" : undefined}
      rel={isHttp ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl bg-white border border-border hover:border-amber hover:shadow-sm transition-all text-left"
    >
      <span className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center flex-shrink-0">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-navy">{label}</span>
        {sub && <span className="block text-[11px] text-gray truncate">{sub}</span>}
      </span>
    </a>
  );
}

export async function BusinessCardContent({ slug }: { slug: string }) {
  const sponsor = await fetchSponsorByCardSlug(slug);

  if (!sponsor) {
    return (
      <main className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-lg font-extrabold text-white mb-2">Card not found</div>
          <p className="text-sm text-white/60 mb-5">This business card is unavailable.</p>
          <Link
            href="/sponsors"
            className="inline-block px-5 py-2.5 rounded-xl bg-amber text-navy text-sm font-bold"
          >
            Explore KLAGON partners
          </Link>
        </div>
      </main>
    );
  }

  const contact = parseContact(sponsor.contact);
  const location = parseLocation(sponsor.location);
  const wa = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hello ${sponsor.name}, I found you via KLAGON.`
      )}`
    : "#";
  const quoteText = `Hi ${sponsor.name}, I'd like to request a quote.`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-navy to-blue flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm text-white text-center mb-5">
        <span className="text-[10px] font-bold tracking-widest uppercase text-amber">KLAGON Verified Business</span>
      </div>

      <div className="w-full max-w-sm bg-light rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-br from-navy to-coral h-20 relative" />
        <div className="px-5 pb-5 -mt-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white border border-border shadow flex items-center justify-center text-2xl font-extrabold text-navy mx-auto overflow-hidden">
            {sponsor.logo_url ? (
              <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-contain p-2" />
            ) : (
              <span>{initialsOf(sponsor.name)}</span>
            )}
          </div>
          <h1 className="text-lg font-extrabold text-navy mt-3 mb-0.5">{sponsor.name}</h1>
          {sponsor.tagline && <p className="text-xs text-gray mb-3">{sponsor.tagline}</p>}
          {sponsor.featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber text-navy text-[10px] font-bold mb-1">
              <Star size="10" fill="currentColor" /> Featured Business
            </span>
          )}
        </div>

        <div className="px-5 pb-5 flex flex-col gap-2.5">
          <TapAction
            href={wa}
            icon={<MessageSquareQuote size="16" />}
            label="Chat on WhatsApp"
            sub="Fastest response"
          />
          {contact.phone && (
            <TapAction
              href={`tel:${contact.phone.replace(/\D/g, "")}`}
              icon={<Phone size="16" />}
              label="Call"
              sub={contact.phone}
            />
          )}
          {contact.email && (
            <TapAction
              href={`mailto:${contact.email}`}
              icon={<Mail size="16" />}
              label="Email"
              sub={contact.email}
            />
          )}
          {contact.website && (
            <TapAction
              href={contact.website}
              icon={<Globe size="16" />}
              label="Website"
              sub={contact.website.replace(/^https?:\/\//, "")}
            />
          )}
          {location.google_maps_url && (
            <TapAction
              href={location.google_maps_url}
              icon={<MapPin size="16" />}
              label="Directions"
              sub={location.area ?? "Open in Maps"}
            />
          )}
          {wa !== "#" && (
            <a
              href={`https://wa.me/${contact.whatsapp?.replace(/\D/g, "")}?text=${encodeURIComponent(quoteText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
            >
              Request a Quote
            </a>
          )}
        </div>
      </div>

      <p className="mt-6 text-[11px] text-white/70 text-center">
        Powered by{" "}
        <Link href="/" className="font-bold text-amber hover:underline">
          KLAGON
        </Link>{" "}
        ·{" "}
        <Link href="/sponsors" className="font-bold text-amber hover:underline">
          {sponsor.name} is a verified KLAGON partner
        </Link>
      </p>
    </main>
  );
}