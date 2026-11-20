"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Leaf,
  Plus,
  Minus,
  CheckCircle2,
  ArrowLeft,
  MapPin,
  Sparkles,
} from "lucide-react";
import type { Product } from "@/types/store";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/format";
import { ProductReviewsSection } from "@/components/ProductReviewsSection";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { addToCart, wishlistIds, toggleWishlist, user, settings, showToast } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"benefits" | "ingredients" | "usage">("benefits");

  // FlavourFlow-inspired Course/Pack selector (1 month, 3 months, 6 months)
  const [selectedCourse, setSelectedCourse] = useState<1 | 3 | 6>(1);

  // FlavourFlow-inspired Pincode delivery estimator
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<{
    checked: boolean;
    days: string;
    express: boolean;
  } | null>(null);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${params.slug}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data.product);
      } else {
        setProduct(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.slug) loadProduct();
  }, [params.slug]);

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pincode.replace(/\D/g, "");
    if (clean.length !== 6) {
      showToast("Please enter a valid 6-digit Indian PIN code", "error");
      return;
    }
    const isGujarat = clean.startsWith("38") || clean.startsWith("39");
    setPincodeStatus({
      checked: true,
      days: isGujarat ? "2 business days (Express Dispatch)" : "3–4 business days (All-India)",
      express: isGujarat,
    });
    try {
      localStorage.setItem("pranveda_pincode", clean);
    } catch {}
  };

  const handleReviewSubmit = async (reviewData: {
    authorName: string;
    rating: number;
    title: string;
    comment: string;
  }) => {
    if (!product) return;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        ...reviewData,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Failed to post review", "error");
      throw new Error(data.error || "Failed to post review");
    }
    showToast("Thank you! Your review has been published.", "success");
    await loadProduct();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square rounded-3xl bg-linen animate-pulse" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 bg-linen rounded-xl animate-pulse" />
            <div className="h-6 w-1/2 bg-linen rounded-xl animate-pulse" />
            <div className="h-32 w-full bg-linen rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-4xl font-bold text-forest mb-3">
          Formulation Not Found
        </h1>
        <p className="text-muted mb-6">
          This product may have been updated or removed.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-forest text-cream text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlistIds.includes(product.id);
  const images = product.images.length > 0 ? product.images : ["/images/ashwagandha.jpg"];
  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-muted mb-5 sm:mb-8">
        <Link href="/" className="hover:text-forest">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-forest">
          Shop
        </Link>
        <span>/</span>
        <span className="text-forest font-semibold">{product.name}</span>
      </div>

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 sm:gap-12 items-start">
        {/* Gallery */}
        <div className="space-y-3 sm:space-y-4">
          <div className="aspect-square rounded-3xl sm:rounded-[32px] overflow-hidden bg-white border border-sand shadow-sm">
            <img
              src={images[activeImage] || images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                    activeImage === idx ? "border-forest" : "border-sand"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5 sm:space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-linen text-forest text-xs font-semibold">
                {product.category?.name}
              </span>
              {product.concerns.map((c) => (
                <Link
                  key={c}
                  href={`/shop?concern=${encodeURIComponent(c)}`}
                  className="px-3 py-1 rounded-full bg-gold/15 text-forest border border-gold/40 text-xs font-semibold hover:bg-gold/25"
                >
                  {c}
                </Link>
              ))}
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-forest leading-tight">
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="text-sm sm:text-base text-muted mt-2">{product.subtitle}</p>
            )}

            <div className="flex items-center gap-2.5 sm:gap-3 mt-3 sm:mt-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.avgRating)
                        ? "fill-gold text-gold"
                        : "text-sand"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-forest">
                {product.avgRating.toFixed(1)}
              </span>
              <a href="#reviews" className="text-xs text-muted underline">
                ({product.reviewCount} customer reviews)
              </a>
            </div>
          </div>

          {/* Dynamic Wellness Course Selector (FlavourFlow Inspired) */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white border border-sand space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-gold" /> Select Ayurvedic Course
              </label>
              <span className="text-[11px] text-[#1F6E43] font-bold bg-[#1F6E43]/10 px-2.5 py-0.5 rounded-full">
                ~{formatINR(Math.round(
                  (product.price * (selectedCourse === 3 ? 0.85 : selectedCourse === 6 ? 0.75 : 1) * selectedCourse) / (30 * selectedCourse)
                ))}/day
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCourse(1)}
                className={`p-3 rounded-2xl border-2 text-center transition cursor-pointer ${
                  selectedCourse === 1
                    ? "border-forest bg-forest/5 shadow-xs"
                    : "border-sand bg-cream/40 hover:border-forest/40"
                }`}
              >
                <div className="text-xs font-bold text-forest">1 Month</div>
                <div className="text-[10px] text-muted mt-0.5">Trial Pack</div>
                <div className="font-sans text-xs font-bold text-forest mt-1">
                  {formatINR(product.price)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCourse(3)}
                className={`relative p-3 rounded-2xl border-2 text-center transition cursor-pointer ${
                  selectedCourse === 3
                    ? "border-forest bg-forest/5 shadow-xs"
                    : "border-sand bg-cream/40 hover:border-forest/40"
                }`}
              >
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-gold text-forest text-[9px] font-black uppercase tracking-wider shadow-xs whitespace-nowrap">
                  Save 15%
                </span>
                <div className="text-xs font-bold text-forest">3 Months</div>
                <div className="text-[10px] text-muted mt-0.5">Most Popular</div>
                <div className="font-sans text-xs font-bold text-forest mt-1">
                  {formatINR(Math.round(product.price * 3 * 0.85))}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCourse(6)}
                className={`relative p-3 rounded-2xl border-2 text-center transition cursor-pointer ${
                  selectedCourse === 6
                    ? "border-forest bg-forest/5 shadow-xs"
                    : "border-sand bg-cream/40 hover:border-forest/40"
                }`}
              >
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-terracotta text-white text-[9px] font-black uppercase tracking-wider shadow-xs whitespace-nowrap">
                  Save 25%
                </span>
                <div className="text-xs font-bold text-forest">6 Months</div>
                <div className="text-[10px] text-muted mt-0.5">Full Ritual</div>
                <div className="font-sans text-xs font-bold text-forest mt-1">
                  {formatINR(Math.round(product.price * 6 * 0.75))}
                </div>
              </button>
            </div>

            {/* Price Display */}
            <div className="pt-2 border-t border-sand/70 flex items-baseline gap-2.5 flex-wrap">
              <span className="font-sans text-3xl sm:text-4xl font-extrabold text-forest tabular-nums tracking-tight">
                {formatINR(
                  Math.round(
                    product.price *
                      (selectedCourse === 3 ? 0.85 : selectedCourse === 6 ? 0.75 : 1) *
                      selectedCourse
                  )
                )}
              </span>
              {selectedCourse > 1 && (
                <span className="text-base sm:text-lg text-muted line-through font-sans tabular-nums">
                  {formatINR(product.price * selectedCourse)}
                </span>
              )}
              {selectedCourse > 1 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#1F6E43]/15 text-[#1F6E43] text-xs font-bold font-sans">
                  You save {selectedCourse === 3 ? "15%" : "25%"} + Free Gift
                </span>
              )}
              <span className="text-xs text-muted w-full sm:w-auto sm:ml-auto">
                {selectedCourse === 1
                  ? product.packSize
                  : `${selectedCourse} × ${product.packSize} (${selectedCourse} Months Daily Supply)`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              {product.stock > 0 ? (
                <span className="text-[#1F6E43] inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  In Stock ({product.stock} available) — Dispatches in 24 hours
                </span>
              ) : (
                <span className="text-terracotta">Currently Out of Stock</span>
              )}
            </div>

            {/* Qty + Buttons */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-full border border-sand bg-cream">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2.5 sm:p-3 text-forest hover:bg-linen rounded-l-full cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-forest">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))}
                    className="p-2.5 sm:p-3 text-forest hover:bg-linen rounded-r-full cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-xs font-semibold transition cursor-pointer ${
                    isWishlisted
                      ? "bg-terracotta text-white border-terracotta"
                      : "border-sand bg-cream text-forest hover:border-forest"
                  }`}
                  aria-label="Toggle wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
                  <span>{isWishlisted ? "Saved" : "Wishlist"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  disabled={product.stock <= 0}
                  onClick={() => {
                    const finalUnitPrice = Math.round(
                      product.price * (selectedCourse === 3 ? 0.85 : selectedCourse === 6 ? 0.75 : 1)
                    );
                    addToCart(
                      {
                        ...product,
                        name:
                          selectedCourse === 1
                            ? product.name
                            : `${product.name} (${selectedCourse}-Month Course)`,
                        price: finalUnitPrice,
                        packSize:
                          selectedCourse === 1
                            ? product.packSize
                            : `${selectedCourse} × ${product.packSize}`,
                      },
                      selectedCourse * quantity
                    );
                  }}
                  className="py-3.5 px-4 rounded-full bg-forest text-cream text-xs sm:text-sm font-semibold hover:bg-forest-light disabled:opacity-40 transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-gold shrink-0" />
                  Add {selectedCourse > 1 ? `${selectedCourse} Jars` : "to Bag"}
                </button>

                <button
                  disabled={product.stock <= 0}
                  onClick={() => {
                    const finalUnitPrice = Math.round(
                      product.price * (selectedCourse === 3 ? 0.85 : selectedCourse === 6 ? 0.75 : 1)
                    );
                    addToCart(
                      {
                        ...product,
                        name:
                          selectedCourse === 1
                            ? product.name
                            : `${product.name} (${selectedCourse}-Month Course)`,
                        price: finalUnitPrice,
                        packSize:
                          selectedCourse === 1
                            ? product.packSize
                            : `${selectedCourse} × ${product.packSize}`,
                      },
                      selectedCourse * quantity
                    );
                    router.push("/checkout");
                  }}
                  className="py-3.5 px-4 rounded-full bg-gold text-forest text-xs sm:text-sm font-bold hover:bg-gold-light disabled:opacity-40 transition cursor-pointer"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>

          {/* PINCODE DELIVERY ESTIMATOR (FLAVOURFLOW INSPIRED) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-sand space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest">
              <MapPin className="w-4 h-4 text-gold" /> Check Delivery to Your Pincode
            </div>
            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit PIN Code (e.g. 380054)"
                className="flex-1 rounded-xl border border-sand bg-cream/50 px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-forest font-sans tabular-nums"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-forest text-cream text-xs font-bold hover:bg-forest-light transition shrink-0 cursor-pointer"
              >
                Check
              </button>
            </form>

            {pincodeStatus?.checked && (
              <div className="text-xs text-[#1F6E43] font-semibold space-y-1 bg-[#1F6E43]/10 p-3 rounded-xl border border-[#1F6E43]/20">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1F6E43]" />
                  <span>Deliverable to PIN {pincode} — <strong>{pincodeStatus.days}</strong></span>
                </div>
                <div className="text-[11px] text-muted pl-5.5">
                  ✓ Free Delivery on ₹499+ • ✓ Cash on Delivery (COD) Available • ✓ Safe Apothecary Glass Packaging
                </div>
              </div>
            )}
          </div>

          <p className="text-sm sm:text-base text-ink/85 leading-relaxed">
            {product.description}
          </p>

          {/* Mini Guarantees */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-linen/70 border border-sand/70">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-gold mx-auto mb-1" />
              <div className="text-[10px] sm:text-[11px] font-semibold text-forest">100% Herbal</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-2xl bg-linen/70 border border-sand/70">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-gold mx-auto mb-1" />
              <div className="text-[10px] sm:text-[11px] font-semibold text-forest">Lab Tested</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-2xl bg-linen/70 border border-sand/70">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gold mx-auto mb-1" />
              <div className="text-[10px] sm:text-[11px] font-semibold text-forest">
                Free {formatINR(settings.freeShippingThreshold)}+
              </div>
            </div>
          </div>

          {/* Detail Tabs */}
          <div className="rounded-3xl bg-white border border-sand overflow-hidden">
            <div className="flex border-b border-sand bg-linen/50">
              {[
                { id: "benefits", label: "Benefits" },
                { id: "ingredients", label: "Ingredients" },
                { id: "usage", label: "How to Use" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 py-3 sm:py-3.5 px-2 sm:px-4 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-white text-forest border-b-2 border-forest"
                      : "text-muted hover:text-forest"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-4 sm:p-6 text-sm text-ink/85 leading-relaxed whitespace-pre-line">
              {activeTab === "benefits" &&
                (product.benefits || "Supports daily holistic vitality and dosha balance.")}
              {activeTab === "ingredients" &&
                (product.ingredients || "100% pure authentic Ayurvedic herbs.")}
              {activeTab === "usage" &&
                (product.howToUse || "Use daily as directed on the apothecary label.")}
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <ProductReviewsSection
        productId={product.id}
        productName={product.name}
        reviews={product.reviews || []}
        avgRating={product.avgRating || 5.0}
        reviewCount={product.reviewCount || 0}
        onSubmitReview={handleReviewSubmit}
        defaultAuthorName={user?.name || ""}
      />
    </div>
  );
}
