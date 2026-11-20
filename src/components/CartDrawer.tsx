"use client";

import React from "react";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/format";

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    cartSubtotal,
    updateCartQty,
    removeFromCart,
    settings,
  } = useStore();

  if (!cartOpen) return null;

  const threshold = settings.freeShippingThreshold;
  const remaining = Math.max(0, threshold - cartSubtotal);
  const progressPct = Math.min(100, Math.round((cartSubtotal / Math.max(1, threshold)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={() => setCartOpen(false)}
        className="fixed inset-0 bg-ink/45 backdrop-blur-[2px]"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 w-full max-w-md bg-cream h-full flex flex-col shadow-2xl border-l border-sand">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-sand flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-forest" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-forest">Your Wellness Bag</h2>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 rounded-full hover:bg-linen text-muted hover:text-forest transition"
            aria-label="Close bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping progress */}
        <div className="px-4 sm:px-6 py-3 bg-linen/80 border-b border-sand">
          <div className="flex items-center gap-2 text-xs font-medium text-forest mb-2">
            <Truck className="w-4 h-4 text-gold shrink-0" />
            {remaining === 0 ? (
              <span>
                Congratulations! You unlocked <strong className="text-forest">FREE Shipping</strong>
              </span>
            ) : (
              <span>
                Add <strong>{formatINR(remaining)}</strong> more for{" "}
                <strong className="text-forest">FREE Shipping</strong>
              </span>
            )}
          </div>
          <div className="h-1.5 w-full rounded-full bg-sand overflow-hidden">
            <div
              className="h-full bg-forest transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-full bg-linen flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-forest mb-2">
                Your bag is empty
              </h3>
              <p className="text-sm text-muted max-w-xs mb-6">
                Explore pure Himalayan &amp; classical Ayurvedic formulations crafted for daily harmony.
              </p>
              <Link
                href="/shop"
                onClick={() => setCartOpen(false)}
                className="px-6 py-3 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-forest-light transition"
              >
                Explore Formulations
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 p-3.5 rounded-2xl bg-white border border-sand/80 shadow-xs"
              >
                <Link
                  href={`/product/${item.slug}`}
                  onClick={() => setCartOpen(false)}
                  className="w-20 h-20 rounded-xl overflow-hidden bg-linen shrink-0 border border-sand/60"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={() => setCartOpen(false)}
                      className="font-serif text-lg font-semibold text-forest leading-tight hover:text-gold transition line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-muted hover:text-terracotta p-1 transition"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{item.packSize}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-sand bg-cream">
                      <button
                        onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                        className="p-1.5 text-forest hover:bg-linen rounded-l-full"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-semibold text-ink">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                        className="p-1.5 text-forest hover:bg-linen rounded-r-full"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="font-semibold text-forest text-sm">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 bg-white border-t border-sand space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-sans text-2xl font-extrabold text-forest tabular-nums tracking-tight">
                {formatINR(cartSubtotal)}
              </span>
            </div>
            <p className="text-xs text-muted">
              Coupons &amp; shipping calculated at checkout. Use <strong>PRAN10</strong> for 10% off.
            </p>
            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <Link
                href="/checkout"
                onClick={() => setCartOpen(false)}
                className="w-full py-3.5 px-6 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-forest-light transition flex items-center justify-center gap-2 shadow-md"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 text-gold" />
              </Link>
              <Link
                href="/cart"
                onClick={() => setCartOpen(false)}
                className="w-full py-2.5 px-6 rounded-full border border-sand text-forest text-xs font-semibold hover:bg-linen transition text-center"
              >
                View Full Bag &amp; Apply Coupon
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
