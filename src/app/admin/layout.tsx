"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Mail,
  Settings,
  ArrowLeft,
  Leaf,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products & Photos", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/emails", label: "Email Logs", icon: Mail },
  { href: "/admin/settings", label: "Store Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, userLoading, refreshUser, logout, showToast } = useStore();

  const [email, setEmail] = useState("admin@pranveda.in");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Invalid credentials", "error");
        return;
      }
      if (data.user?.role !== "ADMIN") {
        showToast("This account does not have Admin privileges.", "error");
        return;
      }
      await refreshUser();
      showToast("Signed in to PranVeda Admin Panel", "success");
    } finally {
      setLoggingIn(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-muted text-sm">
        Verifying admin session...
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[32px] border border-sand p-8 shadow-lg space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-forest text-gold flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">PranVeda Admin</p>
            <h1 className="font-serif text-3xl font-bold text-forest mt-1">
              Administrator Sign In
            </h1>
            <p className="text-xs text-muted mt-1">
              Manage your products, photos, orders, email notifications, and store settings.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">Admin Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-sand bg-cream/60 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-xl border border-sand bg-cream/60 px-4 py-2.5 text-sm focus:outline-none focus:border-forest"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 rounded-full bg-forest text-cream text-sm font-bold hover:bg-forest-light disabled:opacity-50 transition cursor-pointer"
            >
              {loggingIn ? "Signing In..." : "Enter Admin Panel"}
            </button>
          </form>

          <div className="p-3.5 rounded-2xl bg-linen border border-sand text-xs text-muted text-center">
            Default Admin: <strong className="text-forest">admin@pranveda.in</strong> /{" "}
            <strong className="text-forest">Admin@123</strong>
          </div>

          <div className="text-center">
            <Link href="/" className="text-xs font-semibold text-forest hover:text-gold">
              ← Return to Live Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F2EB] flex flex-col lg:flex-row">
      {/* Sidebar / Mobile Top Bar */}
      <aside className="lg:w-64 bg-forest text-cream shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-gold/20">
        <div className="px-4 py-3.5 sm:p-6 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gold/20 border border-gold/40 text-gold flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div>
              <div className="font-serif text-lg sm:text-xl font-bold tracking-[0.12em] sm:tracking-[0.14em] leading-none">
                PRANVEDA
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-gold font-semibold mt-0.5">
                Admin Console
              </div>
            </div>
          </div>

          {/* Mobile quick actions */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <Link
              href="/"
              className="px-2.5 py-1.5 rounded-full bg-white/10 text-[11px] font-semibold text-cream inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gold" /> Store
            </Link>
            <button
              onClick={logout}
              className="p-2 rounded-full bg-white/10 text-cream/85"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2.5 lg:p-4 gap-1.5 lg:space-y-1 flex lg:flex-col overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 lg:gap-3 px-3.5 lg:px-4 py-2 lg:py-2.5 rounded-full lg:rounded-xl text-xs lg:text-sm font-medium shrink-0 transition ${
                  active
                    ? "bg-gold text-forest font-bold shadow-xs"
                    : "text-cream/80 hover:bg-white/10 hover:text-cream"
                }`}
              >
                <Icon className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2 hidden lg:block">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-cream/85 hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-4 h-4 text-gold" /> View Live Store
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-cream/75 hover:bg-white/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10">{children}</div>
    </div>
  );
}
