"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Phone, MessageCircle, Globe, Star, BadgeCheck, ShieldCheck, X, ChevronRight } from "lucide-react";
import type { DirectoryBusiness, DirectorySnapshot } from "@/lib/directory";
import { initialsOf, waHref, telHref } from "@/lib/directory";

type SortKey = "featured" | "rating" | "reviews" | "name";

const CLAIM_WA = "233268708895";

const btn =
  "inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer font-sans";
const btnNavy = "bg-navy text-white hover:bg-blue";
const btnAmber = "bg-amber text-navy hover:bg-amber-strong hover:text-white";
const btnGhost = "bg-white text-navy border border-border hover:border-navy";
const chip = "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-border text-gray hover:border-navy hover:text-navy cursor-pointer transition-colors font-sans whitespace-nowrap";
const chipOn = "bg-navy text-white border-navy hover:text-white";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber font-bold text-xs">
      <Star size="12" fill="currentColor" />
      {rating.toFixed(1)}
    </span>
  );
}

function BusinessCard({ b, onClaim }: { b: DirectoryBusiness; onClaim: (b: DirectoryBusiness) => void }) {
  const contact = b.wa || b.tel ? (
    b.wa ? (
      <a href={waHref(b.wa, b.name)} target="_blank" rel="noopener noreferrer" className={`${btn} ${btnNavy} flex-1`}>
        <MessageCircle size="13" /> WhatsApp
      </a>
    ) : (
      <a href={telHref(b.tel)} className={`${btn} ${btnNavy} flex-1`}>
        <Phone size="13" /> Call
      </a>
    )
  ) : (
    <span className="flex-1 text-[11px] text-gray font-semibold px-1 py-2">
      No number yet — know it?{" "}
      <button onClick={() => onClaim(b)} className="underline font-bold text-navy cursor-pointer">tell us</button>
    </span>
  );

  return (
    <article className="flex flex-col gap-2.5 bg-white rounded-2xl border border-border p-5 hover:border-navy/30 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-pale border border-border flex items-center justify-center text-sm font-extrabold text-navy flex-shrink-0">
          {initialsOf(b.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-extrabold text-navy leading-snug">
              <Link href={`/directory/${b.slug}`} className="hover:text-blue transition-colors">
                {b.name}
              </Link>
            </h3>
            {b.rating != null && <Stars rating={b.rating} />}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {b.verified ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green text-white text-[10px] font-bold">
                <BadgeCheck size="11" /> Verified
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber/15 text-amber-800 text-[10px] font-bold tracking-wide uppercase max-w-full truncate">
                {b.category}
              </span>
            )}
            {b.phoneVerified && !b.verified && (
              <span className="text-[10px] font-bold text-green-700">✓ Phone on record</span>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray leading-relaxed">{b.title}</p>

      <div className="flex items-start gap-1.5 text-xs text-gray font-medium">
        <MapPin size="12" className="mt-0.5 flex-shrink-0 text-navy/40" />
        <span className="line-clamp-2">{b.area}</span>
      </div>

      {b.phone && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
          <Phone size="12" className="text-green-700" /> {b.phone}
        </div>
      )}

      {b.hours && (
        <div className="text-[11px] text-gray border-t border-border pt-2 line-clamp-1">🕘 {b.hours}</div>
      )}

      <div className="flex items-stretch gap-2 mt-auto pt-1">
        {contact}
        {b.website && (
          <a href={b.website} target="_blank" rel="noopener noreferrer" className={`${btn} ${btnGhost} flex-1`}>
            <Globe size="13" /> Site
          </a>
        )}
        <button onClick={() => onClaim(b)} className={`${btn} ${btnGhost} flex-1`}>
          <ShieldCheck size="13" /> Claim
        </button>
      </div>

      <Link
        href={`/directory/${b.slug}`}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-navy hover:text-blue transition-colors mt-0.5"
      >
        View full profile <ChevronRight size="12" />
      </Link>
    </article>
  );
}

export function BusinessDirectoryContent({ snapshot }: { snapshot: DirectorySnapshot }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [claim, setClaim] = useState<DirectoryBusiness | null>(null);
  const [claimName, setClaimName] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimOk, setClaimOk] = useState(false);

  const stats = snapshot.stats;

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = snapshot.businesses.filter(
      (b) =>
        (!activeCategory || b.category === activeCategory) &&
        (!term || `${b.name} ${b.category} ${b.title} ${b.area}`.toLowerCase().includes(term)),
    );
    const ranked = [...list];
    switch (sort) {
      case "rating":
        ranked.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviews ?? 0) - (a.reviews ?? 0));
        break;
      case "reviews":
        ranked.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
        break;
      case "name":
        ranked.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        ranked.sort(
          (a, b) =>
            Number(b.verified) - Number(a.verified) ||
            (b.rating ?? 0) - (a.rating ?? 0) ||
            a.name.localeCompare(b.name),
        );
    }
    return ranked;
  }, [snapshot.businesses, query, activeCategory, sort]);

  function sendClaim() {
    if (!claim) return;
    if (!claimName.trim() || !claimPhone.trim()) {
      alert("Please add your name and WhatsApp number.");
      return;
    }
    const text = `Hi KlagonOrg! I want to claim my business listing: ${claim.name} (${claim.id} · ${claim.area}). My name is ${claimName.trim()}, WhatsApp ${claimPhone.trim()}.`;
    window.open(`https://wa.me/${CLAIM_WA}?text=${encodeURIComponent(text)}`, "_blank");
    setClaimOk(true);
  }

  return (
    <main className="w-full">
      <section className="bg-navy relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-amber/8 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">Klagon Business Directory</div>
          <h1 className="text-[clamp(1.9rem,4vw,2.9rem)] font-extrabold text-white tracking-tight leading-tight mb-3 max-w-2xl">
            Every business in Klagon, findable in one place.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mb-8">
            Search shops, clinics, schools, chop bars and services across Klagon, Lashibi and Tema. Own one?
            Claim your listing free and get the verified badge.
          </p>
          <div className="flex flex-wrap gap-8 sm:gap-10 mb-8">
            <div><div className="text-2xl font-extrabold text-amber">{stats.total}</div><div className="text-[11px] font-bold uppercase tracking-widest text-white/50">businesses</div></div>
            <div><div className="text-2xl font-extrabold text-amber">{stats.categories}</div><div className="text-[11px] font-bold uppercase tracking-widest text-white/50">categories</div></div>
            <div><div className="text-2xl font-extrabold text-amber">{stats.withPhone}</div><div className="text-[11px] font-bold uppercase tracking-widest text-white/50">with phone</div></div>
            <div><div className="text-2xl font-extrabold text-amber">{stats.verified}</div><div className="text-[11px] font-bold uppercase tracking-widest text-white/50">verified</div></div>
          </div>
          <div className="relative max-w-xl">
            <Search size="16" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, category or area… e.g. pharmacy, clinic, Lashibi"
              className="w-full rounded-xl border border-white/20 bg-white/8 text-white placeholder:text-white/45 px-4 py-3 pl-11 text-sm outline-none focus:border-amber transition-colors font-sans"
            />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="flex gap-2 pb-5 overflow-x-auto">
          <button
            onClick={() => setActiveCategory("")}
            className={`${chip} ${activeCategory === "" ? chipOn : ""}`}
          >
            All <span className="opacity-60">({stats.total})</span>
          </button>
          {snapshot.categories.slice(0, 24).map((c) => (
            <button
              key={c.name}
              onClick={() => setActiveCategory(activeCategory === c.name ? "" : c.name)}
              className={`${chip} ${activeCategory === c.name ? chipOn : ""}`}
            >
              {c.name} <span className="opacity-60">({c.count})</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="text-sm font-bold text-gray">
            Showing <span className="text-navy">{visible.length}</span> of {stats.total}
            {activeCategory && <span className="text-gray font-semibold"> in {activeCategory}</span>}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="dir-sort" className="text-xs font-bold text-gray">Sort</label>
            <select
              id="dir-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-border bg-white text-xs font-bold text-navy px-3 py-2 outline-none focus:border-navy cursor-pointer font-sans"
            >
              <option value="featured">Featured first</option>
              <option value="rating">Top rated</option>
              <option value="reviews">Most reviewed</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="bg-light rounded-2xl border border-border p-10 text-center">
            <p className="text-sm font-bold text-navy mb-1">No match for &quot;{query}&quot;</p>
            <p className="text-sm text-gray">Try a different search or clear the category filter.</p>
            <button
              onClick={() => { setQuery(""); setActiveCategory(""); }}
              className="mt-4 px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer font-sans"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((b) => (
              <BusinessCard key={b.id} b={b} onClaim={setClaim} />
            ))}
          </div>
        )}

        <p className="mt-8 text-[11px] text-gray bg-light border border-border rounded-lg px-3 py-2.5">
          <strong>How this directory works:</strong> Most listings here are compiled from Klagon&apos;s public
          business registry and the Google Maps census, with phone numbers gently verified. They stay visible but
          basic until the owner claims them via WhatsApp — claimed listings get the verified badge, hours, photos
          and offers. Anything missing? Use the claim form to tell us.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-navy rounded-2xl px-6 sm:px-10 py-8 sm:py-10 flex flex-col sm:flex-row gap-8 items-start sm:items-center">
          <div className="flex-1">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-2">Own a business in Klagon?</div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">Claim your listing — free, in 2 minutes.</h2>
            <p className="text-white/70 text-sm max-w-lg">
              Claimed listings get the verified badge, top placement in search, and space for hours, photos and offers.
              Unclaimed pages stay visible but basic.
            </p>
          </div>
          <a
            href={`https://wa.me/${CLAIM_WA}?text=${encodeURIComponent("Hi KlagonOrg! I want to claim my business listing.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} ${btnAmber} px-6 py-3.5 text-sm whitespace-nowrap`}
          >
            <MessageCircle size="15" /> Claim on WhatsApp
          </a>
        </div>
      </section>

      {claim && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,17,40,0.55)] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setClaim(null); }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl">
            {!claimOk ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-navy tracking-tight">Claim this listing</h3>
                    <p className="text-sm text-gray mt-0.5"><span className="font-bold text-navy">{claim.name}</span> · {claim.area}</p>
                  </div>
                  <button onClick={() => setClaim(null)} className="p-1 rounded-lg hover:bg-light cursor-pointer" aria-label="Close">
                    <X size="18" />
                  </button>
                </div>
                <label className="block text-xs font-bold text-navy mb-1.5">Your name</label>
                <input
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  placeholder="e.g. Ama Serwaa"
                  className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none focus:border-amber font-sans"
                />
                <label className="block text-xs font-bold text-navy mb-1.5 mt-4">Your WhatsApp number</label>
                <input
                  value={claimPhone}
                  onChange={(e) => setClaimPhone(e.target.value)}
                  placeholder="e.g. 055 123 4567"
                  className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none focus:border-amber font-sans"
                />
                <div className="flex items-center gap-2.5 mt-6">
                  <button onClick={() => setClaim(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-bold text-navy cursor-pointer hover:bg-light font-sans">
                    Cancel
                  </button>
                  <button onClick={sendClaim} className="flex-1 px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-bold cursor-pointer hover:bg-blue font-sans">
                    Send claim
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-gray">We&apos;ll open WhatsApp with your claim pre-filled — we verify within 24 hours.</p>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-green text-white flex items-center justify-center text-2xl font-extrabold mx-auto mb-4">✓</div>
                <h3 className="text-lg font-extrabold text-navy mb-1">Claim almost sent!</h3>
                <p className="text-sm text-gray">
                  Tap send in WhatsApp to confirm you own <span className="font-bold text-navy">{claim.name}</span>.
                  We verify within 24 hours.
                </p>
                <button
                  onClick={() => { setClaim(null); setClaimOk(false); setClaimName(""); setClaimPhone(""); }}
                  className="mt-5 px-5 py-2.5 rounded-lg bg-navy text-white text-sm font-bold cursor-pointer font-sans"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}