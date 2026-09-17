import { Award } from "lucide-react";
import type { SponsorRow } from "@/lib/sponsors";

export function PrintCertificate({
  sponsor,
  tierLabel,
  badgeLabel,
  awardedAt,
}: {
  sponsor: SponsorRow;
  tierLabel: string;
  badgeLabel: string;
  awardedAt: string;
}) {
  const date = new Date(awardedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="bg-white p-8 sm:p-12"
      style={{ printColorAdjust: "exact" }}
    >
      <div className="border-4 border-amber rounded-2xl p-6 sm:p-10 text-center max-w-lg mx-auto">
        <div className="text-[10px] font-bold tracking-widest uppercase text-amber mb-2">
          Klagon Org
        </div>
        <div className="text-[11px] font-bold tracking-widest uppercase text-gray mb-6">
          Certificate of Partnership
        </div>
        <Award size="40" className="mx-auto text-amber mb-4" />
        <p className="text-sm text-gray mb-1">This certifies that</p>
        <h2 className="text-xl sm:text-2xl font-extrabold text-navy mb-1">{sponsor.name}</h2>
        <p className="text-sm text-gray mb-4">
          is a verified <span className="font-bold text-navy">{tierLabel}</span> partner of KLAGON Org,
        </p>
        <p className="text-sm text-gray mb-6">
          recognised as a <span className="font-bold text-navy">{badgeLabel}</span> for supporting
          youth development and innovation in Klagon.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-8 pt-4 border-t border-border text-center">
          <div>
            <div className="text-xs font-bold text-navy">{date}</div>
            <div className="text-[10px] text-gray">Date awarded</div>
          </div>
          <div>
            <div className="text-xs font-bold text-navy">KLAGON Org</div>
            <div className="text-[10px] text-gray">klagon.org</div>
          </div>
        </div>
      </div>
    </div>
  );
}