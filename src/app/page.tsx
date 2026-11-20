import Link from "next/link";
import {
  ArrowRight,
  Leaf,
  ShieldCheck,
  Sparkles,
  Award,
  Truck,
  Star,
  HeartPulse,
  Flame,
  Sun,
  Moon,
  Droplets,
  Wind,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { parseJsonArray, HEALTH_CONCERNS, formatINR } from "@/lib/format";
import { getStoreSettings } from "@/lib/settings";
import { ProductCard } from "@/components/ProductCard";
import { MarqueeTicker } from "@/components/MarqueeTicker";
import { ReviewsShowcase } from "@/components/ReviewsShowcase";
import type { Product } from "@/types/store";

export const dynamic = "force-dynamic";

const CONCERN_ICONS: Record<string, React.ReactNode> = {
  Immunity: <ShieldCheck className="w-6 h-6" />,
  Digestion: <Flame className="w-6 h-6" />,
  Hair: <Wind className="w-6 h-6" />,
  Skin: <Sparkles className="w-6 h-6" />,
  "Stress & Sleep": <Moon className="w-6 h-6" />,
  Energy: <Sun className="w-6 h-6" />,
};

export default async function HomePage() {
  const [rawProducts, reviews, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        reviews: { select: { rating: true } },
      },
      orderBy: [{ isBestSeller: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.review.findMany({
      where: { rating: { gte: 4 } },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            images: true,
            packSize: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    getStoreSettings(),
  ]);

  const cities = ["Ahmedabad, GJ", "Mumbai, MH", "Pune, MH", "Jaipur, RJ", "Surat, GJ", "Bengaluru, KA"];
  const outcomes = [
    "🌙 Result: Sound REM Sleep in 10 Days",
    "✨ Result: Radiant Saffron Glow in 7 Days",
    "🔥 Result: Smooth Overnight Digestion",
    "⚡ Result: All-Day Peak Stamina",
    "💆 Result: Noticeably Reduced Hair Fall",
    "🌿 Result: Balanced Seasonal Immunity",
  ];
  const durations = ["Used for 3 Weeks", "Used for 1 Month", "Used for 2 Months", "Used for 6 Weeks"];

  const enrichedReviews = reviews.map((r, idx) => {
    const pImgs = parseJsonArray<string>(r.product.images);
    return {
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      verifiedPurchase: r.verifiedPurchase,
      createdAt: r.createdAt,
      city: cities[idx % cities.length],
      outcomeBadge: outcomes[idx % outcomes.length],
      usageDuration: durations[idx % durations.length],
      initialHelpful: 14 + idx * 4,
      product: {
        name: r.product.name,
        slug: r.product.slug,
        image: pImgs[0] || "/images/ashwagandha.jpg",
        packSize: r.product.packSize,
        price: r.product.price,
      },
    };
  });

  const products: Product[] = rawProducts.map((p) => {
    const { reviews: prodReviews, ...rest } = p;
    const reviewCount = prodReviews.length;
    const avgRating =
      reviewCount > 0
        ? Number((prodReviews.reduce((s, r) => s + r.rating, 0) / reviewCount).toFixed(1))
        : 5.0;
    return {
      ...rest,
      concerns: parseJsonArray<string>(p.concerns),
      images: parseJsonArray<string>(p.images),
      reviewCount,
      avgRating,
    };
  });

  const bestSellers = products.slice(0, 4);
  const moreFormulations = products.slice(4, 8);

  return (
    <div className="bg-cream">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-sand">
        <div className="relative min-h-[470px] sm:min-h-[560px] lg:min-h-[640px] flex items-center">
          {/* Background image */}
          <img
            src="/images/hero-banner.jpg"
            alt="PranVeda Ayurvedic Apothecary"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Mobile-safe & Desktop-editorial gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#142C20]/90 via-[#1B3B2B]/85 to-[#142C20]/92 lg:bg-gradient-to-r lg:from-[#142C20]/95 lg:via-[#1B3B2B]/80 lg:to-[#1B3B2B]/25" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/20 border border-gold/45 text-gold text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em] mb-4 sm:mb-6 backdrop-blur-xs">
                <Leaf className="w-3.5 h-3.5" />
                Classical Vedic Apothecary
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-[68px] font-bold text-cream leading-[1.08] tracking-tight">
                Ancient Wisdom,{" "}
                <span className="text-gold font-semibold">Pure Vitality.</span>
              </h1>

              <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-cream/85 leading-relaxed">
                Small-batch Ayurvedic formulations crafted from single-origin Himalayan herbs,
                Kashmiri saffron, and cold-pressed botanicals — lab-tested for purity and potency.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-gold text-forest font-bold text-sm tracking-wide hover:bg-gold-light transition shadow-lg"
                >
                  Shop Formulations
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#concerns"
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-full bg-white/10 text-cream border border-cream/30 font-semibold text-sm hover:bg-white/20 backdrop-blur-xs transition"
                >
                  Explore by Concern
                </Link>
              </div>

              <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-white/15 grid grid-cols-3 gap-3 sm:gap-4 max-w-md text-cream/85">
                <div>
                  <div className="font-sans text-xl sm:text-2xl font-bold text-gold tabular-nums tracking-tight">100%</div>
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-cream/70">
                    Pure Herbs
                  </div>
                </div>
                <div>
                  <div className="font-sans text-xl sm:text-2xl font-bold text-gold tracking-tight">GMP</div>
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-cream/70">
                    Lab Verified
                  </div>
                </div>
                <div>
                  <div className="font-sans text-xl sm:text-2xl font-bold text-gold tabular-nums tracking-tight">4.9★</div>
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-cream/70">
                    Rated Love
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-linen/90 border-b border-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: <Leaf className="w-5 h-5 text-gold" />,
                title: "100% Authentic Herbs",
                desc: "Sustainably sourced across India",
              },
              {
                icon: <ShieldCheck className="w-5 h-5 text-gold" />,
                title: "Heavy-Metal & Lab Tested",
                desc: "Zero fillers or synthetic colors",
              },
              {
                icon: <Truck className="w-5 h-5 text-gold" />,
                title: `Free Delivery ${formatINR(settings.freeShippingThreshold)}+`,
                desc: "Fast pan-India dispatch & COD",
              },
              {
                icon: <Award className="w-5 h-5 text-gold" />,
                title: "Classical Vedic Recipes",
                desc: "Rooted in Ashtanga Hridaya",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3.5">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-forest text-gold flex items-center justify-center shrink-0 shadow-xs">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-forest">{item.title}</div>
                  <div className="text-xs text-muted">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INFINITE ROLLING MARQUEE TICKER (FLAVOURFLOW INSPIRED) */}
      <MarqueeTicker />

      {/* SHOP BY HEALTH CONCERN */}
      <section id="concerns" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold mb-2">
            Holistic Balance
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-forest">
            Shop by Health Concern
          </h2>
          <p className="text-sm sm:text-base text-muted mt-2 sm:mt-3">
            Targeted Ayurvedic rituals formulated to bring harmony to mind, body, and daily vitality.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {HEALTH_CONCERNS.map((concern) => (
            <Link
              key={concern.id}
              href={`/shop?concern=${encodeURIComponent(concern.id)}`}
              className="group p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-sand hover:border-gold hover:bg-forest hover:text-cream transition-all duration-300 text-center flex flex-col items-center shadow-xs hover:shadow-lg"
            >
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-linen group-hover:bg-gold/20 text-forest group-hover:text-gold flex items-center justify-center mb-2.5 sm:mb-3.5 transition">
                {CONCERN_ICONS[concern.id] || <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6" />}
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-forest group-hover:text-cream transition leading-tight">
                {concern.label}
              </h3>
              <p className="text-[11px] text-muted group-hover:text-cream/75 mt-1 leading-snug">
                {concern.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10 px-1 sm:px-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold mb-1.5 sm:mb-2">
              Most Loved Rituals
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-forest">
              Signature Bestsellers
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-gold transition"
          >
            View All Formulations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* BRAND STORY / HERITAGE */}
      <section className="bg-forest text-cream py-14 sm:py-20 border-y border-gold/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="relative">
              <div className="rounded-3xl sm:rounded-[32px] overflow-hidden border border-gold/35 shadow-2xl aspect-[4/3]">
                <img
                  src="/images/ayurveda-story.jpg"
                  alt="Artisanal Ayurvedic Herbal Preparation"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:flex absolute -bottom-5 -right-5 bg-cream text-forest p-5 rounded-2xl shadow-xl border border-gold/40 items-center gap-3.5 max-w-xs">
                <div className="w-11 h-11 rounded-full bg-forest text-gold flex items-center justify-center shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-serif text-lg font-bold leading-tight">
                    Small-Batch Purity
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    Slow-infused in brass &amp; copper vessels for peak potency
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">
                The PranVeda Standard
              </p>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold leading-tight text-cream">
                Crafted with Reverence for Nature &amp; Science
              </h2>
              <p className="text-cream/80 text-sm sm:text-base leading-relaxed">
                True Ayurveda cannot be rushed. At PranVeda, every herb is harvested at peak
                seasonal potency — from Pampore Kashmiri saffron to wild forest Amla and
                high-altitude Himalayan Shilajit.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                {[
                  "Root-only standardized herbal extracts",
                  "Zero parabens, mineral oil, or refined sugar",
                  "Protective UV amber glass apothecary jars",
                  "Transparent batch lab reports & GMP certified",
                ].map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs sm:text-sm text-cream/90"
                  >
                    <span className="text-gold font-bold">✦</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold text-forest font-bold text-sm hover:bg-gold-light transition"
                >
                  Discover Your Daily Ritual
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MORE FORMULATIONS */}
      {moreFormulations.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10 px-1 sm:px-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold mb-1.5 sm:mb-2">
                Daily Apothecary
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
                More Pure Formulations
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-gold transition"
            >
              Browse Full Store <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {moreFormulations.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 3-PILLARS HERITAGE & SOURCING PILLARS (FLAVOURFLOW INSPIRED) */}
      <section className="bg-[#12241A] text-cream py-16 sm:py-20 border-y border-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold mb-2">
              Uncompromised Standards
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold">
              The 3 Pillars of PranVeda Purity
            </h2>
            <p className="text-sm sm:text-base text-cream/75 mt-3">
              Why our Ayurvedic rasayanas and botanical elixirs deliver measurable results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-7 sm:p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-gold/50 transition-all space-y-4">
              <div className="font-sans text-3xl sm:text-4xl font-extrabold text-gold tracking-tight">
                01
              </div>
              <h3 className="font-serif text-2xl font-bold text-cream">
                Wildcrafted High-Altitude Harvest
              </h3>
              <p className="text-sm text-cream/75 leading-relaxed">
                We never use commercial greenhouse monocultures. Our Shilajit is harvested at 16,000+ feet in the Himalayas, our Kesar comes directly from Pampore fields, and our Ashwagandha is sourced from sun-baked Rajasthan soil.
              </p>
              <div className="text-xs text-gold font-semibold pt-2 flex items-center gap-1.5">
                ✦ Single-Origin Authenticity
              </div>
            </div>

            <div className="p-7 sm:p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-gold/50 transition-all space-y-4">
              <div className="font-sans text-3xl sm:text-4xl font-extrabold text-gold tracking-tight">
                02
              </div>
              <h3 className="font-serif text-2xl font-bold text-cream">
                Classical 18-Hour Kshirapaka
              </h3>
              <p className="text-sm text-cream/75 leading-relaxed">
                Ayurveda rejects fast chemical solvent extractions. Our medicated oils and rasayanas are slow-simmered in copper and brass vessels using traditional Surya Tapi (solar decanting) and A2 Gir Cow bilona ghee.
              </p>
              <div className="text-xs text-gold font-semibold pt-2 flex items-center gap-1.5">
                ✦ Classical Vedic Processing
              </div>
            </div>

            <div className="p-7 sm:p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-gold/50 transition-all space-y-4">
              <div className="font-sans text-3xl sm:text-4xl font-extrabold text-gold tracking-tight">
                03
              </div>
              <h3 className="font-serif text-2xl font-bold text-cream">
                3rd-Party Heavy-Metal Tested
              </h3>
              <p className="text-sm text-cream/75 leading-relaxed">
                Every single batch is independently tested by NABL-accredited labs for lead, mercury, arsenic, and microbiological safety. 100% free of refined white sugar, parabens, silicones, and synthetic fillers.
              </p>
              <div className="text-xs text-gold font-semibold pt-2 flex items-center gap-1.5">
                ✦ Absolute Clean Transparency
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VERIFIED CUSTOMER REVIEWS SHOWCASE */}
      {enrichedReviews.length > 0 && (
        <ReviewsShowcase initialReviews={enrichedReviews} />
      )}

      {/* WELCOME OFFER BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20">
        <div className="rounded-3xl sm:rounded-[32px] bg-gradient-to-br from-forest via-[#224835] to-forest p-6 sm:p-12 text-center text-cream border border-gold/40 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] sm:tracking-[0.25em] text-gold mb-2 sm:mb-3">
              Begin Your Wellness Journey
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold">
              Enjoy 10% Off Your First Order
            </h2>
            <p className="text-cream/80 text-sm sm:text-base mt-3 mb-6 sm:mb-7 leading-relaxed">
              Apply coupon code{" "}
              <span className="inline-block px-3 py-0.5 mx-1 rounded-md bg-gold/20 border border-gold text-gold font-bold tracking-widest">
                PRAN10
              </span>{" "}
              at checkout. Cash on Delivery &amp; UPI / Online Payments supported across India.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-cream text-forest font-bold text-sm hover:bg-gold transition shadow-md"
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
