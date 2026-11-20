"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, Sparkles } from "lucide-react";
import type { Category, Product } from "@/types/store";
import { ProductCard } from "@/components/ProductCard";
import { HEALTH_CONCERNS } from "@/lib/format";

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [concern, setConcern] = useState(searchParams.get("concern") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "featured");

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setCategory(searchParams.get("category") || "");
    setConcern(searchParams.get("concern") || "");
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    if (concern) params.set("concern", concern);
    if (sort) params.set("sort", sort);

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, category, concern, sort]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setConcern("");
    setSort("featured");
    router.replace("/shop");
  };

  const hasFilters = Boolean(search || category || concern);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-7 sm:py-12">
      {/* Header */}
      <div className="rounded-3xl bg-forest text-cream p-5 sm:p-10 mb-6 sm:mb-10 border border-gold/30 flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6">
        <div>
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-gold mb-1.5 sm:mb-2">
            PranVeda Apothecary
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold">
            {concern ? `${concern} Formulations` : "All Ayurvedic Formulations"}
          </h1>
          <p className="text-xs sm:text-sm text-cream/80 mt-2 max-w-xl">
            Small-batch herbal capsules, classical churnas, botanical oils, and Himalayan resins crafted for holistic balance.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search herbs, oils, concerns..."
            className="w-full rounded-full bg-white/10 border border-cream/25 pl-11 pr-4 py-2.5 sm:py-3 text-sm text-cream placeholder:text-cream/55 focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        {/* Concern Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted shrink-0 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-gold" /> Concern:
          </span>
          <button
            onClick={() => setConcern("")}
            className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
              concern === ""
                ? "bg-forest text-cream shadow-xs"
                : "bg-white border border-sand text-forest hover:border-forest"
            }`}
          >
            All Concerns
          </button>
          {HEALTH_CONCERNS.map((c) => (
            <button
              key={c.id}
              onClick={() => setConcern(concern === c.id ? "" : c.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
                concern === c.id
                  ? "bg-forest text-cream shadow-xs"
                  : "bg-white border border-sand text-forest hover:border-forest"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Category + Sort row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-sand/80">
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gold mr-1" />
            <button
              onClick={() => setCategory("")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                category === ""
                  ? "bg-gold/20 text-forest border border-gold font-semibold"
                  : "bg-linen text-muted hover:text-forest"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(category === cat.slug ? "" : cat.slug)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  category === cat.slug
                    ? "bg-gold/20 text-forest border border-gold font-semibold"
                    : "bg-linen text-muted hover:text-forest"
                }`}
              >
                {cat.name}
              </button>
            ))}

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-terracotta hover:bg-terracotta/10 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-full bg-white border border-sand px-3.5 py-2 text-xs font-semibold text-forest focus:outline-none focus:border-forest"
            >
              <option value="featured">Featured &amp; Bestsellers</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-72 sm:h-96 rounded-2xl sm:rounded-3xl bg-linen/70 border border-sand animate-pulse"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 sm:py-20 px-4 bg-white rounded-3xl border border-sand">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest mb-2">
            No matching formulations found
          </h3>
          <p className="text-sm text-muted mb-6">
            Try clearing your filters or searching another herb or wellness concern.
          </p>
          <button
            onClick={clearFilters}
            className="px-6 py-3 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-forest-light transition"
          >
            View All Products
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted mb-4 sm:mb-5 px-1 sm:px-0">
            Showing <strong className="text-forest">{products.length}</strong> authentic formulations
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted">
          Loading PranVeda formulations...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
