"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  Truck,
  ShieldCheck,
  Tag,
  Smartphone,
  MailCheck,
  ArrowRight,
  Lock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/format";
import type { OrderData } from "@/types/store";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { cart, cartSubtotal, clearCart, user, settings, showToast } = useStore();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("Gujarat");
  const [shippingPincode, setShippingPincode] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("RAZORPAY");

  const [couponInput, setCouponInput] = useState(searchParams.get("coupon") || "");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null
  );
  const [placing, setPlacing] = useState(false);

  // Razorpay Demo Modal state (shown only when keys have not yet been saved in Admin Settings)
  const [demoModal, setDemoModal] = useState<{
    order: OrderData;
    razorpayOrderId: string;
  } | null>(null);
  const [verifyingPay, setVerifyingPay] = useState(false);

  // Completed Order
  const [confirmedOrder, setConfirmedOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName((v) => v || user.name || "");
      setCustomerEmail((v) => v || user.email || "");
      setCustomerPhone((v) => v || user.phone || "");
      setShippingAddress((v) => v || user.address || "");
      setShippingCity((v) => v || user.city || "");
      setShippingState((v) => v || user.state || "Gujarat");
      setShippingPincode((v) => v || user.pincode || "");
    }
  }, [user]);

  useEffect(() => {
    const preCoupon = searchParams.get("coupon");
    if (preCoupon && cartSubtotal > 0 && !appliedCoupon) {
      fetch(`/api/coupons?validate=${encodeURIComponent(preCoupon)}&subtotal=${cartSubtotal}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.coupon) {
            setAppliedCoupon({ code: d.coupon.code, discount: d.coupon.discount });
          }
        })
        .catch(() => {});
    }
  }, [searchParams, cartSubtotal, appliedCoupon]);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
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
  };

  const discount = appliedCoupon?.discount || 0;
  const afterDiscount = Math.max(0, cartSubtotal - discount);
  const shippingFee = afterDiscount >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const total = afterDiscount + shippingFee;

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          shippingCity,
          shippingState,
          shippingPincode,
          notes,
          paymentMethod,
          couponCode: appliedCoupon?.code || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not create order", "error");
        return;
      }

      if (paymentMethod === "COD") {
        clearCart();
        setConfirmedOrder(data.order);
        showToast("Order placed! Confirmation email sent.", "success");
        return;
      }

      // Online payment flow:
      // If live Razorpay credentials are saved in Admin Settings, open real Razorpay checkout!
      if (data.razorpay?.mode === "live") {
        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay) {
          showToast("Could not load Razorpay SDK. Please check your internet connection.", "error");
          return;
        }
        const rzp = new window.Razorpay({
          key: data.razorpay.keyId,
          amount: data.razorpay.amount,
          currency: data.razorpay.currency,
          name: settings.storeName,
          description: `Order #${data.order.orderNumber}`,
          order_id: data.razorpay.id,
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone,
          },
          theme: { color: "#142C20" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            const verifyRes = await fetch("/api/orders/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.order.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              clearCart();
              setConfirmedOrder(verifyData.order);
              showToast("Payment verified! Confirmation email sent.", "success");
            } else {
              showToast(verifyData.error || "Payment verification failed.", "error");
            }
          },
        });
        rzp.open();
        return;
      }

      // If Razorpay keys have not yet been entered in Admin Settings, show demo simulation modal:
      setDemoModal({
        order: data.order,
        razorpayOrderId: data.razorpay.id,
      });
    } finally {
      setPlacing(false);
    }
  };

  const completeDemoPayment = async () => {
    if (!demoModal) return;
    setVerifyingPay(true);
    try {
      const res = await fetch("/api/orders/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: demoModal.order.id,
          razorpayOrderId: demoModal.razorpayOrderId,
          razorpayPaymentId: `pay_demo_${Date.now()}`,
          razorpaySignature: `sig_demo_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Payment verification failed", "error");
        return;
      }
      setDemoModal(null);
      clearCart();
      setConfirmedOrder(data.order);
      showToast("Demo payment verified! Confirmation email sent.", "success");
    } finally {
      setVerifyingPay(false);
    }
  };

  // ORDER CONFIRMATION SCREEN
  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-[32px] border border-sand p-8 sm:p-10 text-center shadow-lg space-y-6">
          <div className="w-18 h-18 rounded-full bg-[#1F6E43]/15 text-[#1F6E43] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              Order Confirmed
            </p>
            <h1 className="font-serif text-4xl font-bold text-forest mt-1">
              Thank You, {confirmedOrder.customerName}!
            </h1>
            <p className="text-sm text-muted mt-2">
              Your PranVeda order{" "}
              <strong className="text-forest">#{confirmedOrder.orderNumber}</strong> has been
              received.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linen border border-sand text-xs font-medium text-forest">
            <MailCheck className="w-4 h-4 text-gold" />
            Confirmation email sent to <strong>{confirmedOrder.customerEmail}</strong>
          </div>

          <div className="bg-cream rounded-2xl p-5 text-left space-y-2.5 text-sm border border-sand/80">
            <div className="flex justify-between">
              <span className="text-muted">Order Number</span>
              <span className="font-bold text-forest">{confirmedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Payment Method</span>
              <span className="font-semibold text-forest">
                {confirmedOrder.paymentMethod === "COD"
                  ? "Cash on Delivery"
                  : `Online Payment (${confirmedOrder.paymentStatus})`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Total Paid / Payable</span>
              <span className="font-sans text-xl font-extrabold text-forest tabular-nums tracking-tight">
                {formatINR(confirmedOrder.total)}
              </span>
            </div>
            <div className="pt-2 border-t border-sand/70 text-xs text-muted">
              Delivering to: {confirmedOrder.shippingAddress}, {confirmedOrder.shippingCity},{" "}
              {confirmedOrder.shippingState} - {confirmedOrder.shippingPincode}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href={`/track-order?order=${encodeURIComponent(confirmedOrder.orderNumber)}`}
              className="px-7 py-3.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-forest-light transition inline-flex items-center gap-2"
            >
              Track Order Status <ArrowRight className="w-4 h-4 text-gold" />
            </Link>
            <Link
              href="/shop"
              className="px-7 py-3.5 rounded-full border border-sand text-forest text-sm font-semibold hover:bg-linen transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-4xl font-bold text-forest mb-3">Your bag is empty</h1>
        <p className="text-sm text-muted mb-6">Add PranVeda formulations to proceed to checkout.</p>
        <Link
          href="/shop"
          className="px-7 py-3.5 rounded-full bg-forest text-cream text-sm font-semibold"
        >
          Explore Store
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Secure Checkout</p>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-forest">
          Complete Your Order
        </h1>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left: Shipping & Payment */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6">
          {/* Contact & Address */}
          <div className="bg-white rounded-3xl border border-sand p-5 sm:p-8 space-y-4">
            <h2 className="font-serif text-2xl font-bold text-forest mb-2">
              1. Delivery Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">Full Name *</label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Aarav Patel"
                  className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Email (For Order Notifications) *
                </label>
                <input
                  required
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Mobile Number (WhatsApp / Delivery) *
                </label>
                <input
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">PIN Code *</label>
                <input
                  required
                  value={shippingPincode}
                  onChange={(e) => setShippingPincode(e.target.value)}
                  placeholder="380054"
                  className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Street Address / Flat / Landmark *
              </label>
              <textarea
                required
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="House / Apartment no., Society, Area"
                className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">City *</label>
                <input
                  required
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="Ahmedabad"
                  className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">State *</label>
                <input
                  required
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                  placeholder="Gujarat"
                  className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Order Notes (Optional)
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any delivery instruction..."
                className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-3xl border border-sand p-6 sm:p-8 space-y-4">
            <h2 className="font-serif text-2xl font-bold text-forest mb-2">
              2. Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("RAZORPAY")}
                className={`p-5 rounded-2xl border-2 text-left transition cursor-pointer relative overflow-hidden ${
                  paymentMethod === "RAZORPAY"
                    ? "border-forest bg-forest/5 shadow-xs"
                    : "border-sand hover:border-forest/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-forest">
                    <CreditCard className="w-5 h-5 text-forest" />
                    <Smartphone className="w-4 h-4 text-gold" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/25 text-forest">
                    Automated &amp; Instant
                  </span>
                </div>
                <div className="font-bold text-forest text-sm flex items-center gap-1.5">
                  Pay Online (Razorpay)
                </div>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  UPI (GPay, PhonePe, Paytm), Debit/Credit Cards &amp; NetBanking.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`p-5 rounded-2xl border-2 text-left transition cursor-pointer ${
                  paymentMethod === "COD"
                    ? "border-forest bg-forest/5"
                    : "border-sand hover:border-forest/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Truck className="w-5 h-5 text-forest" />
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-linen text-forest">
                    Pay at Door
                  </span>
                </div>
                <div className="font-bold text-forest text-sm">Cash on Delivery (COD)</div>
                <p className="text-xs text-muted mt-1">
                  Pay comfortably in cash or UPI when your order arrives.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-sand p-6 sm:p-7 space-y-5 sticky top-28">
          <h2 className="font-serif text-2xl font-bold text-forest">Order Summary</h2>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-3.5">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 rounded-xl object-cover border border-sand shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-forest truncate">{item.name}</div>
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

          {/* Coupon */}
          <div className="pt-4 border-t border-sand space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Coupon code (e.g. PRAN10)"
                className="flex-1 rounded-full border border-sand bg-cream/60 px-4 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-forest"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="px-4 py-2 rounded-full bg-linen border border-sand text-forest text-xs font-semibold hover:bg-forest hover:text-cream transition cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 inline mr-1" /> Apply
              </button>
            </div>
            {appliedCoupon && (
              <p className="text-xs text-[#1F6E43] font-semibold">
                ✓ {appliedCoupon.code} applied (-{formatINR(appliedCoupon.discount)})
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm border-t border-sand pt-4">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold">{formatINR(cartSubtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[#1F6E43]">
                <span>Discount</span>
                <span>-{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span className="font-semibold">
                {shippingFee === 0 ? "FREE" : formatINR(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-sand text-forest font-bold">
              <span>Total Payable</span>
              <span className="font-sans text-3xl font-extrabold tabular-nums tracking-tight">
                {formatINR(total)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={placing}
            className="w-full py-4 px-6 rounded-full bg-forest text-cream text-sm font-bold hover:bg-forest-light disabled:opacity-50 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-gold" />
            {placing
              ? "Processing..."
              : paymentMethod === "COD"
                ? `Place COD Order (${formatINR(total)})`
                : `Pay ${formatINR(total)} Securely`}
          </button>

          <p className="text-[11px] text-center text-muted flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-gold" />
            Instant email order receipt &amp; live status updates sent to your inbox
          </p>
        </div>
      </form>

      {/* RAZORPAY TEST / DEMO SIMULATION MODAL (When keys not yet entered in Admin) */}
      {demoModal && (
        <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] sm:rounded-[36px] max-w-md w-full overflow-hidden shadow-2xl border border-sand my-auto">
            {/* Modal Header */}
            <div className="bg-forest text-cream px-6 py-5 border-b border-gold/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gold font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Demo Gateway Simulator
                  </div>
                  <h3 className="font-serif text-2xl font-bold mt-0.5">{settings.storeName}</h3>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-cream/70 font-medium">Order Total</div>
                  <div className="font-sans text-2xl font-extrabold text-gold tabular-nums tracking-tight">
                    {formatINR(demoModal.order.total)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <strong className="font-bold text-amber-950 block mb-0.5">Admin Notice: Live Keys Pending</strong>
                    Your store admin can add live Razorpay <strong>Key ID &amp; Key Secret</strong> anytime in{" "}
                    <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono">/admin/settings</code>.
                    Once added, real Razorpay checkout (Cards, UPI, NetBanking) will open automatically!
                  </div>
                </div>
              </div>

              <div className="bg-cream/60 rounded-2xl p-4 border border-sand space-y-2 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Order Number</span>
                  <span className="font-mono font-bold text-forest">#{demoModal.order.orderNumber}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Razorpay Reference</span>
                  <span className="font-mono font-semibold text-forest truncate max-w-[200px]">{demoModal.razorpayOrderId}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Recipient Email</span>
                  <span className="font-medium text-forest truncate max-w-[200px]">{customerEmail}</span>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDemoModal(null)}
                  className="px-4 py-2.5 rounded-full border border-sand text-xs font-semibold text-muted hover:text-forest transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={verifyingPay}
                  onClick={completeDemoPayment}
                  className="flex-1 py-3 px-4 rounded-full bg-forest text-gold text-xs sm:text-sm font-bold hover:bg-forest-light disabled:opacity-50 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {verifyingPay ? "Processing..." : `Simulate Successful Payment`}
                </button>
              </div>

              <p className="text-[10px] text-center text-muted">
                🔒 Safe sandbox mode for testing checkout flow and email notifications before going live.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
