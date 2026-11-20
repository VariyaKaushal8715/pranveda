"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  Heart,
  User,
  Search,
  Menu,
  X,
  ShieldCheck,
  Leaf,
  PackageSearch,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/format";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, setCartOpen, user, wishlistIds, settings } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (pathname?.startsWith("/admin")) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(q ? `/shop?search=${encodeURIComponent(q)}` : "/shop");
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Announcement Bar */}
      <div className="bg-forest text-cream text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 text-center tracking-wide border-b border-gold/25">
        <span className="inline-flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center leading-tight">
          <span className="text-gold font-semibold">✦ FREE SHIPPING</span>
          <span>above {formatINR(settings.freeShippingThreshold)}</span>
          <span className="text-gold/50">•</span>
          <span>
            Code <strong className="text-gold tracking-wider">PRAN10</strong> (10% OFF)
          </span>
        </span>
      </div>

      {/* Main Nav */}
      <div className="bg-cream/95 backdrop-blur-md border-b border-sand/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Mobile trigger + Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                setMobileOpen(!mobileOpen);
                setSearchOpen(false);
              }}
              className="lg:hidden p-2 -ml-1 rounded-full text-forest hover:bg-linen transition shrink-0"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-forest text-gold flex items-center justify-center shadow-sm group-hover:scale-105 transition shrink-0">
                <Leaf className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="leading-none truncate">
                <div className="font-serif text-lg sm:text-[26px] font-bold tracking-[0.1em] sm:tracking-[0.14em] text-forest">
                  {settings.storeName.toUpperCase()}
                </div>
                <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.22em] sm:tracking-[0.26em] text-gold font-semibold mt-0.5 hidden xs:block sm:block">
                  Ayurveda &amp; Wellness
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-ink/85">
            <Link
              href="/"
              className={`hover:text-forest transition ${pathname === "/" ? "text-forest font-semibold" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/shop"
              className={`hover:text-forest transition ${pathname === "/shop" ? "text-forest font-semibold" : ""}`}
            >
              Shop All
            </Link>
            <Link href="/shop?concern=Immunity" className="hover:text-forest transition">
              Immunity
            </Link>
            <Link href="/shop?concern=Skin" className="hover:text-forest transition">
              Skin &amp; Hair
            </Link>
            <Link href="/shop?concern=Stress%20%26%20Sleep" className="hover:text-forest transition">
              Stress &amp; Sleep
            </Link>
            <Link
              href="/track-order"
              className={`inline-flex items-center gap-1 hover:text-forest transition ${
                pathname === "/track-order" ? "text-forest font-semibold" : ""
              }`}
            >
              <PackageSearch className="w-3.5 h-3.5 text-gold" />
              Track Order
            </Link>
          </nav>

          {/* Right: Compact Mobile Icons + Full Desktop Icons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/15 text-forest border border-gold/40 text-xs font-semibold hover:bg-gold/25 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                Admin
              </Link>
            )}

            <button
              onClick={() => {
                setSearchOpen(!searchOpen);
                setMobileOpen(false);
              }}
              className="p-2 sm:p-2.5 rounded-full text-forest hover:bg-linen transition"
              aria-label="Search products"
            >
              <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>

            <Link
              href="/wishlist"
              className="hidden sm:inline-flex relative p-2.5 rounded-full text-forest hover:bg-linen transition"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            <Link
              href="/account"
              className="p-2 sm:p-2.5 rounded-full text-forest hover:bg-linen transition flex items-center gap-1.5"
              aria-label="Account"
            >
              <User className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {user && (
                <span className="hidden md:inline text-xs font-semibold text-forest max-w-20 truncate">
                  {user.name.split(" ")[0]}
                </span>
              )}
            </Link>

            <button
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-1.5 sm:gap-2 pl-2.5 pr-3 sm:pl-3 sm:pr-3.5 py-1.5 sm:py-2 rounded-full bg-forest text-cream hover:bg-forest-light transition shadow-sm"
              aria-label="Open bag"
            >
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gold" />
              <span className="text-xs font-semibold">{cartCount}</span>
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <div className="border-t border-sand bg-linen/90 py-3 px-3 sm:px-4">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Ashwagandha, Kumkumadi, Immunity..."
                className="flex-1 min-w-0 rounded-full bg-white border border-sand px-4 sm:px-5 py-2.5 text-sm text-ink focus:outline-none focus:border-forest"
              />
              <button
                type="submit"
                className="px-4 sm:px-6 py-2.5 rounded-full bg-forest text-cream text-xs sm:text-sm font-semibold hover:bg-forest-light transition shrink-0"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Slide-down Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-sand bg-cream px-4 py-4 space-y-1 shadow-xl max-h-[80vh] overflow-y-auto">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium text-forest hover:bg-linen"
            >
              Home
            </Link>
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium text-forest hover:bg-linen"
            >
              Shop All Formulations
            </Link>
            <div className="grid grid-cols-2 gap-2 py-2 px-1">
              {[
                { label: "Immunity", href: "/shop?concern=Immunity" },
                { label: "Digestion", href: "/shop?concern=Digestion" },
                { label: "Skin Glow", href: "/shop?concern=Skin" },
                { label: "Hair Care", href: "/shop?concern=Hair" },
                { label: "Stress & Sleep", href: "/shop?concern=Stress%20%26%20Sleep" },
                { label: "Energy", href: "/shop?concern=Energy" },
              ].map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 px-3 rounded-xl bg-white border border-sand/80 text-xs font-semibold text-forest text-center hover:border-gold"
                >
                  {c.label}
                </Link>
              ))}
            </div>
            <Link
              href="/wishlist"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium text-forest hover:bg-linen"
            >
              <span className="inline-flex items-center gap-2">
                <Heart className="w-4 h-4 text-terracotta" /> Wishlist
              </span>
              {wishlistIds.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-terracotta text-white text-[11px] font-bold">
                  {wishlistIds.length}
                </span>
              )}
            </Link>
            <Link
              href="/track-order"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium text-forest hover:bg-linen"
            >
              <PackageSearch className="w-4 h-4 text-gold" /> Track Your Order
            </Link>
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium text-forest hover:bg-linen"
            >
              <User className="w-4 h-4 text-gold" />{" "}
              {user ? `My Account (${user.name})` : "Sign In / Register"}
            </Link>
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-forest text-gold text-sm font-bold mt-2"
              >
                <ShieldCheck className="w-4 h-4" /> Open Admin Dashboard
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
