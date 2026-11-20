"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Minus, Trash2, Tag, ArrowRight, ShoppingBag, Truck } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/format";

export default function CartPage() {
  const { cart, cartSubtotal, updateCartQty, removeFromCart, settings, showToast } = useStore();
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null
  );
  const [applying, setApplying] = useState(false);

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplying(true);
    try {
      const res = await fetch(
        `/api/coupons?validate=${encodeURIComponent(couponInput.trim())}&subtotal=${cartSubtotal}`
      );
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Invalid coupon code", "error");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({ code: data.coupon.code, discount: data.coupon.discount });
      showToast(`Coupon ${data.coupon.code} applied!`, "success");
    } finally {
      setApplying(false);
    }
  };

  const discount = appliedCoupon?.discount || 0;
  const afterDiscount = Math.max(0, cartSubtotal - discount);
  const shipping = afterDiscount >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const total = afterDiscount + shipping;

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-linen flex items-center justify-center mx-auto mb-5">
          <ShoppingBag className="w-9 h-9 text-gold" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-forest mb-3">
          Your Wellness Bag is Empty
        </h1>
        <p className="text-sm text-muted mb-8">
          Discover authentic Ayurvedic capsules, churnas, facial elixirs, and pure Himalayan Shilajit.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-forest-light transition"
        >
          Browse Formulations <ArrowRight className="w-4 h-4 text-gold" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="font-serif text-3xl sm:text-5xl font-bold text-forest mb-6 sm:mb-8">
        Your Shopping Bag
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Items */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.productId}
              className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-3xl bg-white border border-sand shadow-xs"
            >
              <div className="flex items-start gap-3.5 sm:contents">
                <Link
                  href={`/product/${item.slug}`}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-linen shrink-0 border border-sand/60"
                >
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${item.slug}`}
                    className="font-serif text-lg sm:text-2xl font-bold text-forest hover:text-gold transition leading-snug block"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">{item.packSize}</p>
                  <div className="text-sm font-semibold text-forest mt-1.5 sm:mt-2">
                    {formatINR(item.price)} each
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-sand/60">
                <div className="inline-flex items-center rounded-full border border-sand bg-cream">
                  <button
                    onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                    className="p-2.5 text-forest hover:bg-linen rounded-l-full cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-forest">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                    className="p-2.5 text-forest hover:bg-linen rounded-r-full cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <div className="font-bold text-forest">
                    {formatINR(item.price * item.quantity)}
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 text-muted hover:text-terracotta transition cursor-pointer"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-sand p-6 space-y-5 sticky top-28">
          <h2 className="font-serif text-2xl font-bold text-forest">Order Summary</h2>

          {/* Coupon form */}
          <form onSubmit={applyCoupon} className="space-y-2">
            <label className="text-xs font-semibold text-forest flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-gold" /> Have a Coupon Code?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Try PRAN10 or WELCOME15"
                className="flex-1 rounded-full border border-sand bg-cream/60 px-4 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-forest"
              />
              <button
                type="submit"
                disabled={applying}
                className="px-4 py-2 rounded-full bg-forest text-cream text-xs font-semibold hover:bg-forest-light cursor-pointer"
              >
                Apply
              </button>
            </div>
            {appliedCoupon && (
              <div className="text-xs text-[#1F6E43] font-semibold">
                ✓ {appliedCoupon.code} applied (-{formatINR(appliedCoupon.discount)})
              </div>
            )}
          </form>

          <div className="space-y-2.5 text-sm border-t border-sand pt-4">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold text-forest">{formatINR(cartSubtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[#1F6E43]">
                <span>Coupon Discount</span>
                <span>-{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-gold" /> Shipping
              </span>
              <span className="font-semibold text-forest">
                {shipping === 0 ? "FREE" : formatINR(shipping)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-forest pt-3 border-t border-sand">
              <span>Total</span>
              <span className="font-sans text-2xl font-extrabold text-forest tabular-nums tracking-tight">
                {formatINR(total)}
              </span>
            </div>
          </div>

          <Link
            href={
              appliedCoupon
                ? `/checkout?coupon=${encodeURIComponent(appliedCoupon.code)}`
                : "/checkout"
            }
            className="w-full py-3.5 px-6 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-forest-light transition flex items-center justify-center gap-2 shadow-md"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4 text-gold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
