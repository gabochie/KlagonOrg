"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * Printable certificate. Digital Academy crest + navy/amber site theme.
 * Core fields only (name / course / date / code) per scope; the QR + printed
 * URL keep a forwarded screenshot or photocopy verifiable at /verify.
 * Shown only to the signed-in holder; printing is window.print() so the
 * holder saves a real PDF with zero dependencies. Print CSS in globals.css
 * strips everything outside `.cert-print` at print time.
 */
export function CertificatePrint({
  recipient,
  course,
  issuedAt,
  code,
}: {
  recipient: string;
  course: string;
  issuedAt: string;
  code: string;
}) {
  const verifyUrl = `https://klagon.org/verify?code=${code}`;
  const date = new Date(issuedAt).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="cert-print bg-white rounded-2xl border-2 border-navy overflow-hidden">
      <div className="bg-navy px-6 py-5 text-center">
        <img
          src="/brand/learning/klagon-digital-academy-crest-512.webp"
          alt="Klagon Digital Academy crest"
          width={72}
          height={80}
          className="mx-auto mb-2 h-20 w-auto bg-[#FFFFFF] rounded-xl px-2 py-1"
        />
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber">
          Klagon Digital Academy
        </div>
        <div className="text-xl font-extrabold text-white tracking-tight mt-1">
          Certificate of Completion
        </div>
      </div>
      <div className="px-6 py-6 text-center">
        <div className="text-xs text-gray mb-1">This certifies that</div>
        <div className="text-2xl font-extrabold text-navy">{recipient}</div>
        <div className="text-xs text-gray mt-3 mb-1">successfully completed</div>
        <div className="text-base font-extrabold text-navy">{course}</div>
        <div className="text-xs text-gray mt-3">Issued {date}</div>
        <div className="mt-5 flex flex-col items-center gap-2">
          <QRCodeSVG value={verifyUrl} size={120} fgColor="#0F1B5C" level="M" />
          <div className="text-xs font-extrabold text-navy tracking-widest">{code}</div>
          <div className="text-[11px] text-gray">
            Verify at <span className="font-bold text-blue">{verifyUrl}</span>
          </div>
        </div>
      </div>
      <div className="bg-amber/15 border-t border-amber/30 px-6 py-2.5 text-center text-[10px] font-bold text-navy tracking-wide">
        KLAGON.org — Skills that open doors.
      </div>
    </div>
  );
}
