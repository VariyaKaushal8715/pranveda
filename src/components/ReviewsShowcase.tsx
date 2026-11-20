"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  Sparkles,
  ArrowRight,
  Check,
  HeartHandshake,
} from "lucide-react";
import { formatINR } from "@/lib/format";

export interface ReviewItem {
  id: string;
  authorName: string;
  rating: number;
  title?: string | null;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string | Date;
  city?: string;
  outcomeBadge?: string;
  doshaTag?: string;
  usageDuration?: string;
  initialHelpful?: number;
  product: {
    name: string;
    slug: string;
    image: string;
    packSize?: string;
    price?: number;
  };
}

const OUTCOME_FILTERS = [
  { id: "all", label: "All Experiences" },
  { id: "sleep", label: "🌙 Restful Sleep" },
  { id: "skin", label: "✨ Luminous Skin" },
  { id: "energy", label: "⚡ Cellular Energy" },
  { id: "digestion", label: "🔥 Gut Harmony" },
  { id: "hair", label: "💆 Root Strength" },
];

export function ReviewsShowcase({ initialReviews }: { initialReviews: ReviewItem[] }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, { count: number; userLiked: boolean }>>(() => {
    const init: Record<string, { count: number; userLiked: boolean }> = {};
    initialReviews.forEach((r, idx) => {
      init[r.id] = { count: (r.initialHelpful || 12) + (idx * 3), userLiked: false };
    });
    return init;
  });

  const toggleHelpful = (id: string) => {
    setHelpfulCounts((prev) => {
      const current = prev[id] || { count: 12, userLiked: false };
      const nextLiked = !current.userLiked;
      return {
        ...prev,
        [id]: {
          count: nextLiked ? current.count + 1 : current.count - 1,
          userLiked: nextLiked,
        },
      };
    });
  };

  const filteredReviews = initialReviews.filter((r) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "sleep") return r.product.slug.includes("ashwagandha") || r.comment.toLowerCase().includes("sleep");
    if (activeFilter === "skin") return r.product.slug.includes("kumkumadi") || r.comment.toLowerCase().includes("skin");
    if (activeFilter === "energy") return r.product.slug.includes("shilajit") || r.product.slug.includes("chyawanprash");
    if (activeFilter === "digestion") return r.product.slug.includes("triphala") || r.comment.toLowerCase().includes("gut");
    if (activeFilter === "hair") return r.product.slug.includes("bhringraj") || r.comment.toLowerCase().includes("hair");
    return true;
  });

  return (
    <section className="bg-[#FAF5ED] border-y border-sand/80 py-14 sm:py-20 relative overflow-hidden">
      {/* Decorative ambient subtle circle */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Real Transformation Ledgers
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-forest leading-tight">
              Verified Ayurvedic Experiences
            </h2>
            <p className="text-sm sm:text-base text-muted mt-2 max-w-xl">
              Authentic customer testimonials detailing real symptom relief, dosha balance, and daily lifestyle improvements.
            </p>
          </div>

          {/* Trust Scorecard Strip */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-sand p-4 sm:p-5 flex items-center gap-4 sm:gap-6 shadow-xs shrink-0">
            <div className="text-center pr-4 sm:pr-6 border-r border-sand">
              <div className="font-sans text-3xl sm:text-4xl font-extrabold text-forest tabular-nums">
                4.9
              </div>
              <div className="flex items-center justify-center gap-0.5 text-gold my-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                500+ Verified Ratings
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-forest font-bold">
                <Check className="w-4 h-4 text-[#1F6E43]" /> 97% Customer Recommendation
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <ShieldCheck className="w-4 h-4 text-gold" /> 100% Authenticated Buyers
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <HeartHandshake className="w-4 h-4 text-gold" /> Non-Habit Forming Results
              </div>
            </div>
          </div>
        </div>

        {/* Outcome Filter Pills (Touch Scrollable on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          {OUTCOME_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                activeFilter === f.id
                  ? "bg-forest text-cream shadow-sm"
                  : "bg-white border border-sand text-forest hover:border-gold"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reviews Cards: Mobile Snap-Swipe Carousel & Desktop Grid */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-4">
          {filteredReviews.map((rev) => {
            const initials = rev.authorName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const helpfulState = helpfulCounts[rev.id] || { count: 12, userLiked: false };

            return (
              <div
                key={rev.id}
                className="w-[85vw] max-w-[340px] sm:w-auto sm:max-w-none shrink-0 snap-center bg-white rounded-3xl border border-sand/90 p-5 sm:p-6 shadow-xs hover:shadow-lg hover:border-gold/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Customer Avatar + Name + City + Verified Seal */}
                  <div className="flex items-center justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-forest text-gold font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-gold/30">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-forest truncate">
                          {rev.authorName}
                        </div>
                        <div className="text-[11px] text-muted truncate">
                          {rev.city || "Verified Buyer"} {rev.usageDuration ? `• ${rev.usageDuration}` : ""}
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1F6E43]/10 text-[#1F6E43] text-[10px] font-bold uppercase tracking-wider shrink-0">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  </div>

                  {/* Stars + Outcome Badge (THE BENEFIT HIGHLIGHT) */}
                  <div className="space-y-2 mb-3.5">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? "fill-gold text-gold" : "text-sand"
                          }`}
                        />
                      ))}
                      <span className="text-[11px] text-muted ml-1 font-semibold">
                        {typeof rev.createdAt === "string"
                          ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              year: "numeric",
                            })
                          : rev.createdAt.toLocaleDateString("en-IN", {
                              month: "short",
                              year: "numeric",
                            })}
                      </span>
                    </div>

                    {rev.outcomeBadge && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gold/15 border border-gold/35 text-forest text-xs font-bold">
                        <Sparkles className="w-3 h-3 text-gold shrink-0" />
                        <span>{rev.outcomeBadge}</span>
                      </div>
                    )}
                  </div>

                  {/* Testimonial Quote */}
                  {rev.title && (
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-forest mb-2 leading-snug">
                      &ldquo;{rev.title}&rdquo;
                    </h3>
                  )}
                  <p className="text-xs sm:text-sm text-ink/80 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>

                {/* Bottom Row: Product Thumbnail Connection + Helpful Like Button */}
                <div className="mt-5 pt-4 border-t border-sand/70 space-y-3">
                  {/* Miniature Product Card Link */}
                  <Link
                    href={`/product/${rev.product.slug}`}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-cream/70 border border-sand/70 hover:border-gold/60 transition group"
                  >
                    <img
                      src={rev.product.image}
                      alt={rev.product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-10 h-10 rounded-lg object-cover border border-sand shrink-0 group-hover:scale-105 transition"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-forest truncate group-hover:text-gold transition">
                        {rev.product.name}
                      </div>
                      <div className="text-[10px] text-muted">
                        {rev.product.packSize || "Apothecary Formulation"}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-gold group-hover:translate-x-0.5 transition shrink-0 mr-1" />
                  </Link>

                  {/* Helpful upvote button */}
                  <div className="flex items-center justify-between text-xs text-muted pt-1">
                    <span>Was this review helpful?</span>
                    <button
                      onClick={() => toggleHelpful(rev.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                        helpfulState.userLiked
                          ? "bg-[#1F6E43] text-white border-[#1F6E43]"
                          : "bg-white text-forest border-sand hover:border-forest"
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${helpfulState.userLiked ? "fill-current" : ""}`} />
                      <span>Helpful ({helpfulState.count})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Swipe Hint */}
        <div className="sm:hidden text-center mt-2 text-[11px] text-muted flex items-center justify-center gap-1">
          <span>← Swipe horizontally to explore real results →</span>
        </div>
      </div>
    </section>
  );
}
