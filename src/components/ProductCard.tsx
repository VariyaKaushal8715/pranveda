"use client";

import React from "react";
import Link from "next/link";
import { Heart, Star, ShoppingBag, Sparkles } from "lucide-react";
import type { Product } from "@/types/store";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, wishlistIds, toggleWishlist } = useStore();
  const isWishlisted = wishlistIds.includes(product.id);
  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  const getDoshaTag = (slug: string) => {
    if (slug.includes("ashwagandha")) return "Vata Calm";
    if (slug.includes("triphala")) return "Tridoshic";
    if (slug.includes("chyawanprash")) return "Ojas Rasayana";
    if (slug.includes("kumkumadi")) return "Kashmiri Kesar";
    if (slug.includes("bhringraj")) return "Kshirapaka Infused";
    if (slug.includes("tulsi")) return "Prana Defense";
    if (slug.includes("brahmi")) return "Medhya Rasayana";
    if (slug.includes("shilajit")) return "16,000ft Gold Grade";
    return "Authentic Herb";
  };

  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl border border-sand/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-gold/50 transition-all duration-300 flex flex-col min-w-0">
      {/* Image */}
      <div className="relative aspect-square bg-linen overflow-hidden">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.images[0] || "/images/ashwagandha.jpg"}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1">
          {product.isBestSeller && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-forest/90 text-gold text-[9px] sm:text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Bestseller
            </span>
          )}
          {discountPct > 0 && (
            <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-terracotta text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider w-fit">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={() => toggleWishlist(product.id)}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition shadow-sm ${
            isWishlisted
              ? "bg-terracotta text-white"
              : "bg-white/90 text-forest hover:bg-forest hover:text-gold"
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-white text-ink text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px] text-muted mb-1">
          <span className="uppercase tracking-wider font-semibold text-gold truncate">
            {getDoshaTag(product.slug)} • {product.concerns[0] || product.category?.name || "Ayurveda"}
          </span>
          <span className="inline-flex items-center gap-0.5 text-forest font-semibold shrink-0">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-gold text-gold" />
            {product.avgRating.toFixed(1)}
          </span>
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="font-serif text-base sm:text-xl font-bold text-forest leading-snug hover:text-gold transition line-clamp-2"
        >
          {product.name}
        </Link>

        <p className="hidden sm:line-clamp-2 text-xs text-muted mt-1 flex-1">
          {product.subtitle || product.description}
        </p>

        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3.5 border-t border-sand/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-lg font-bold text-forest">
                {formatINR(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-[11px] sm:text-xs text-muted line-through">
                  {formatINR(product.compareAtPrice)}
                </span>
              )}
            </div>
            <div className="text-[10px] sm:text-[11px] text-muted truncate">{product.packSize}</div>
          </div>

          <button
            disabled={product.stock <= 0}
            onClick={() => addToCart(product, 1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-forest text-cream text-xs font-semibold hover:bg-forest-light disabled:opacity-40 transition shadow-xs cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-gold" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
