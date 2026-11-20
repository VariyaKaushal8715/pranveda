"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PackageCheck, Package, Truck, Home, Search, XCircle, Check } from "lucide-react";
import type { OrderData } from "@/types/store";
import { formatINR, ORDER_STATUS_STEPS } from "@/lib/format";

const STEP_META = [
  { key: "PLACED", label: "Order Placed", icon: Package },
  { key: "PACKED", label: "Packed", icon: PackageCheck },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Home },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderInput, setOrderInput] = useState(searchParams.get("order") || "");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = async (num: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders?orderNumber=${encodeURIComponent(num.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setOrder(null);
        setError(data.error || "Order not found.");
        return;
      }
      setOrder(data.order);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = searchParams.get("order");
    if (initial) {
      setOrderInput(initial);
      lookup(initial);
    }
  }, [searchParams]);

  const activeIdx = order
    ? ORDER_STATUS_STEPS.indexOf(order.orderStatus as (typeof ORDER_STATUS_STEPS)[number])
    : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="text-center max-w-xl mx-auto mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold mb-2">
          Live Dispatch Status
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-forest">
          Track Your PranVeda Order
        </h1>
        <p className="text-sm text-muted mt-2">
          Enter your order number (for example, <strong>PV-2026-1001</strong>) to check real-time
          fulfillment status.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(orderInput);
        }}
        className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-10"
      >
        <input
          value={orderInput}
          onChange={(e) => setOrderInput(e.target.value)}
          placeholder="Enter Order Number (e.g., PV-2026-1001)"
          className="flex-1 rounded-full bg-white border border-sand px-6 py-3.5 text-sm focus:outline-none focus:border-forest shadow-xs"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-forest-light transition inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <Search className="w-4 h-4 text-gold" />
          {loading ? "Searching..." : "Track Order"}
        </button>
      </form>

      {error && (
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm text-center">
          {error}
        </div>
      )}

      {order && (
        <div className="bg-white rounded-[32px] border border-sand p-6 sm:p-9 shadow-sm space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-sand">
            <div>
              <div className="text-xs text-muted uppercase tracking-wider">Order Number</div>
              <div className="font-sans text-2xl sm:text-3xl font-extrabold text-forest tracking-tight">#{order.orderNumber}</div>
              <div className="text-xs text-muted mt-1">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  order.orderStatus === "CANCELLED"
                    ? "bg-terracotta/15 text-terracotta"
                    : order.orderStatus === "DELIVERED"
                      ? "bg-[#1F6E43]/15 text-[#1F6E43]"
                      : "bg-gold/20 text-forest"
                }`}
              >
                {order.orderStatus}
              </span>
              <div className="text-xs text-muted mt-1.5">
                {order.paymentMethod} • Payment {order.paymentStatus}
              </div>
            </div>
          </div>

          {/* 4-Step Progress Tracker */}
          {order.orderStatus === "CANCELLED" ? (
            <div className="p-5 rounded-2xl bg-terracotta/10 border border-terracotta/25 flex items-center gap-3 text-terracotta">
              <XCircle className="w-6 h-6 shrink-0" />
              <div>
                <div className="font-bold text-sm">This order was cancelled.</div>
                {order.trackingNote && <div className="text-xs mt-0.5">{order.trackingNote}</div>}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5 sm:gap-4 relative">
              {STEP_META.map((step, idx) => {
                const Icon = step.icon;
                const done = idx <= activeIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center relative">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition ${
                        done
                          ? "bg-forest border-forest text-gold shadow-md"
                          : "bg-cream border-sand text-muted"
                      }`}
                    >
                      {done && idx < activeIdx ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <div
                      className={`mt-2 text-[10px] sm:text-sm font-semibold leading-tight ${
                        done ? "text-forest" : "text-muted"
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {order.trackingNote && order.orderStatus !== "CANCELLED" && (
            <div className="p-4 rounded-2xl bg-linen border border-sand text-sm text-forest">
              <strong>Latest Update:</strong> {order.trackingNote}
            </div>
          )}

          {/* Items & Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <h3 className="font-serif text-xl font-bold text-forest">Items Ordered</h3>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-cream/70 border border-sand/70"
                >
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-forest truncate">
                      {item.productName}
                    </div>
                    <div className="text-xs text-muted">
                      {item.packSize} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-forest">
                    {formatINR(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-cream/70 border border-sand/70 space-y-2 text-sm">
                <h3 className="font-serif text-xl font-bold text-forest mb-2">
                  Delivery Address
                </h3>
                <div className="font-semibold text-forest">{order.customerName}</div>
                <div className="text-muted text-xs leading-relaxed">
                  {order.shippingAddress}, {order.shippingCity}, {order.shippingState} -{" "}
                  {order.shippingPincode}
                </div>
                <div className="text-xs text-muted">Phone: {order.customerPhone}</div>
              </div>

              <div className="p-5 rounded-2xl bg-linen/70 border border-sand space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatINR(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-[#1F6E43]">
                    <span>Discount ({order.couponCode})</span>
                    <span>-{formatINR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Shipping</span>
                  <span>{order.shippingFee === 0 ? "FREE" : formatINR(order.shippingFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-forest pt-2 border-t border-sand text-base">
                  <span>Total</span>
                  <span>{formatINR(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-16 text-center">Loading tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
