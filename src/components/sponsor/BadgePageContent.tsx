import Link from "next/link";
import { Award, ExternalLink, QrCode, FileText } from "lucide-react";
import { fetchPublicSponsorBySlug, fetchSponsorBadges, fetchSponsorByCardSlug } from "@/lib/sponsors";
import { BADGE_LABELS, SPONSOR_TIERS } from "@/lib/constants";
import { TierBadge } from "@/components/sponsor/TierBadge";
import { QRCodeBox } from "@/components/sponsor/QRCodeBox";
import { EmbedSnippet } from "@/components/sponsor/EmbedSnippet";
import { PrintCertificate } from "@/components/sponsor/PrintCertificate";
import { PrintButton } from "@/components/sponsor/PrintButton";

export async function BadgePageContent({ slug }: { slug: string }) {
  const sponsor = await fetchPublicSponsorBySlug(slug);
  if (!sponsor) {
    return (
      <main className="w-full">
        <section className="bg-light py-20 px-4 text-center">
          <div className="text-lg font-extrabold text-navy mb-2">Business not found</div>
          <p className="text-sm text-gray mb-5">This business is not a current KLAGON partner.</p>
          <Link href="/sponsors" className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors">
            View Sponsor Wall
          </Link>
        </section>
      </main>
    );
  }

  const badges = await fetchSponsorBadges(sponsor.id);
  const card = await fetchSponsorByCardSlug(slug);
  const cardSlug = card?.slug ?? sponsor.slug;
  const profileUrl = `https://klagon.org/business/${sponsor.slug}`;
  const embedHtml = `<a href="${profileUrl}" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:#0F1B5C;color:#F59E0B;font-family:sans-serif;font-weight:800;font-size:12px;text-decoration:none;">
  ✓ ${BADGE_LABELS[badges[0]?.tier_type ?? "verified"] ?? "KLAGON Verified Business"} — ${sponsor.name}
</a>`;
  const tierLabel = SPONSOR_TIERS.find((t) => t.id === sponsor.tier)?.label ?? "Partner";
  const awardedAt = badges[0]?.awarded_at ?? sponsor.created_at;

  return (
    <main className="w-full">
      <section className="bg-navy py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Award size="36" className="mx-auto text-amber mb-3" />
          <h1 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-extrabold text-white tracking-tight mb-2">
            {sponsor.name} — Verified Business
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Download your badge, generate a certificate, or share a verification link.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">Your Badge</div>
            <div className="bg-gradient-to-br from-navy to-coral rounded-xl p-5 flex flex-col items-center text-white text-center">
              <Award size="28" className="text-amber mb-2" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber mb-1">KLAGON Verified Business</span>
              <span className="text-base font-extrabold mb-1">{sponsor.name}</span>
              <span className="text-[11px] text-white/70 mb-3">{tierLabel} Partner</span>
              <TierBadge tier={sponsor.tier} />
            </div>
            <p className="text-[10px] text-gray mt-3 text-center">
              Awarded {new Date(awardedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6 flex flex-col items-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              <QrCode size="14" className="inline mr-1" />
              Verification QR
            </div>
            <QRCodeBox value={`https://klagon.org/b/${cardSlug}`} />
            <p className="text-[10px] text-gray mt-3 text-center">
              Scan to open <span className="font-bold text-navy">{sponsor.name}</span> on KLAGON
            </p>
            <a
              href={`/b/${cardSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue mt-2"
            >
              Open card <ExternalLink size="11" />
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 mb-10">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            <FileText size="14" className="inline mr-1" />
            Embed on your website
          </div>
          <p className="text-sm text-gray mb-4">Copy this snippet and add it to your website footer or about page.</p>
          <EmbedSnippet html={embedHtml} />
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 mb-10">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Printable Certificate
          </div>
          <p className="text-sm text-gray mb-5">
            Print this certificate or save as PDF from the print dialog.
          </p>
          <div className="border border-border rounded-xl overflow-hidden mb-4" id="certificate-area">
            <PrintCertificate sponsor={sponsor} tierLabel={tierLabel} badgeLabel={BADGE_LABELS[badges[0]?.tier_type ?? "verified"] ?? "KLAGON Verified Business"} awardedAt={awardedAt} />
          </div>
          <PrintButton />
        </div>

        <p className="text-[10px] text-gray text-center">
          Need help? <Link href="/sponsor" className="font-bold text-blue hover:underline">Contact KLAGON</Link>
        </p>
      </section>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-area, #certificate-area * { visibility: visible; }
          #certificate-area { position: absolute; left: 0; top: 0; width: 100%; }
          @page { margin: 0; }
        }
      `}</style>
    </main>
  );
}