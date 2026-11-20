"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import type { Product } from "@/types/store";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/context/StoreContext";

export default function WishlistPage() {
  const { user, wishlistIds } = useStore();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, [user, wishlistIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Saved Rituals</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-forest">Your Wishlist</h1>
      </div>

      {!user ? (
        <div className="bg-white rounded-3xl border border-sand p-12 text-center max-w-xl mx-auto space-y-4">
          <Heart className="w-10 h-10 text-gold mx-auto" />
          <h2 className="font-serif text-3xl font-bold text-forest">
            Sign in to view your wishlist
          </h2>
          <p className="text-sm text-muted">
            Save your favourite PranVeda formulations across devices.
          </p>
          <Link
            href="/account"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-forest text-cream text-sm font-semibold"
          >
            Sign In / Register <ArrowRight className="w-4 h-4 text-gold" />
          </Link>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-96 rounded-3xl bg-linen animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-sand p-12 text-center max-w-xl mx-auto space-y-4">
          <Heart className="w-10 h-10 text-gold mx-auto" />
          <h2 className="font-serif text-3xl font-bold text-forest">No saved formulations yet</h2>
          <p className="text-sm text-muted">
            Tap the heart icon on any product to build your personal Ayurvedic ritual.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-forest text-cream text-sm font-semibold"
          >
            Explore Store <ArrowRight className="w-4 h-4 text-gold" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
