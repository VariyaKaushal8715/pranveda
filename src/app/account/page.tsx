"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Package, ShieldCheck, User, MailCheck, ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/format";
import type { OrderData } from "@/types/store";

export default function AccountPage() {
  const { user, userLoading, refreshUser, logout, showToast } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Auth form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Orders
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadingOrders(true);
      fetch("/api/orders")
        .then((r) => (r.ok ? r.json() : { orders: [] }))
        .then((d) => setOrders(d.orders || []))
        .finally(() => setLoadingOrders(false));
    }
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login" ? { email, password } : { name, email, phone, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Authentication failed", "error");
        return;
      }
      await refreshUser();
      showToast(
        mode === "register"
          ? "Welcome to PranVeda! Check your email for your welcome gift."
          : `Welcome back, ${data.user.name}!`,
        "success"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-muted">
        Loading your PranVeda account...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-[32px] border border-sand p-8 shadow-sm space-y-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              PranVeda Member
            </p>
            <h1 className="font-serif text-4xl font-bold text-forest mt-1">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-xs text-muted mt-1.5">
              {mode === "login"
                ? "Sign in to view orders, wishlist, and faster checkout."
                : "Join PranVeda and receive a welcome email with 10% OFF."}
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 rounded-full bg-linen border border-sand">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                mode === "login" ? "bg-forest text-cream shadow-xs" : "text-muted"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                mode === "register" ? "bg-forest text-cream shadow-xs" : "text-muted"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">Full Name *</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Phone Number
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-forest mb-1">Email *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest mb-1">Password *</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-full bg-forest text-cream text-sm font-bold hover:bg-forest-light disabled:opacity-50 transition cursor-pointer"
            >
              {submitting
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account & Get Welcome Email"}
            </button>
          </form>

          {mode === "register" && (
            <div className="text-[11px] text-muted flex items-center justify-center gap-1.5">
              <MailCheck className="w-4 h-4 text-gold" />
              Automatic email notifications enabled for your account &amp; orders.
            </div>
          )}

          {/* Helpful Demo Credentials Card */}
          <div className="pt-4 border-t border-sand text-xs text-muted space-y-1.5">
            <div className="font-semibold text-forest">Demo Accounts (Quick Test):</div>
            <div>
              Customer: <code className="text-forest">customer@pranveda.in</code> /{" "}
              <code className="text-forest">Customer@123</code>
            </div>
            <div>
              Admin: <code className="text-forest">admin@pranveda.in</code> /{" "}
              <code className="text-forest">Admin@123</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="bg-forest text-cream rounded-3xl p-7 sm:p-9 border border-gold/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold/20 border border-gold/40 text-gold flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold font-bold">
              {user.role === "ADMIN" ? "Store Administrator" : "PranVeda Member"}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">{user.name}</h1>
            <p className="text-xs text-cream/75">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold text-forest text-xs font-bold hover:bg-gold-light transition"
            >
              <ShieldCheck className="w-4 h-4" /> Open Admin Dashboard
            </Link>
          )}
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-cream border border-cream/25 text-xs font-semibold hover:bg-white/20 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Order History */}
      <div>
        <h2 className="font-serif text-3xl font-bold text-forest mb-5 flex items-center gap-2.5">
          <Package className="w-6 h-6 text-gold" /> My Orders
        </h2>

        {loadingOrders ? (
          <div className="p-8 bg-white rounded-3xl border border-sand text-muted text-sm">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 bg-white rounded-3xl border border-sand text-center space-y-3">
            <p className="text-muted text-sm">You haven&apos;t placed an order yet.</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-forest text-cream text-xs font-semibold"
            >
              Explore Formulations <ArrowRight className="w-4 h-4 text-gold" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-sand p-6 space-y-4 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-sand/70">
                  <div>
                    <div className="font-sans text-xl sm:text-2xl font-bold text-forest tracking-tight">
                      #{order.orderNumber}
                    </div>
                    <div className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      • {order.paymentMethod} ({order.paymentStatus})
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1 rounded-full bg-gold/15 text-forest border border-gold/40 text-xs font-bold uppercase">
                      {order.orderStatus}
                    </span>
                    <span className="font-sans text-2xl font-extrabold text-forest tabular-nums tracking-tight">
                      {formatINR(order.total)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-cream border border-sand/70 text-xs"
                      >
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        )}
                        <span className="font-semibold text-forest">{item.productName}</span>
                        <span className="text-muted">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
                    className="text-xs font-bold text-forest hover:text-gold inline-flex items-center gap-1"
                  >
                    Track Status <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
