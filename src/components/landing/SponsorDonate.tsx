import Link from "next/link";
import { Button } from "@/components/ui";

export function SponsorDonate() {
  return (
    <section className="bg-amber py-14 sm:py-16 px-4 sm:px-6 text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-extrabold text-navy tracking-tight mb-2">
          Invest in Klagon&apos;s future.
        </h2>
        <p className="text-sm text-navy/85 leading-relaxed mb-6">
          Whether you&apos;re a company, diaspora member, NGO, or individual — your support funds
          workshops, equipment, mentors, and the community&apos;s next generation of innovators.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/sponsor">
            <Button variant="dark">Become a Sponsor</Button>
          </Link>
          <Link href="/donate">
            <Button variant="outline">Make a Donation</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
