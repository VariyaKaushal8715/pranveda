"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Mail, MapPin, Phone, ShieldCheck, Instagram } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { HEALTH_CONCERNS } from "@/lib/format";

export function Footer() {
  const pathname = usePathname();
  const { settings } = useStore();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-forest text-cream/90 border-t border-gold/30 mt-14 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/40 text-gold flex items-center justify-center">
                <Leaf className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="font-serif text-2xl font-bold tracking-[0.16em] text-cream">
                  {settings.storeName.toUpperCase()}
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-gold">
                  {settings.tagline}
                </div>
              </div>
            </div>
            <p className="text-sm text-cream/70 leading-relaxed">
              Rooted in classical Vedic texts and validated by modern purity testing. Every bottle
              is crafted in small batches using sustainably harvested Indian botanicals.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-gold bg-white/5 px-3 py-1.5 rounded-full border border-gold/25">
              <ShieldCheck className="w-4 h-4" />
              100% Authentic • Lab Tested • GMP Certified
            </div>
          </div>

          {/* Shop by Concern */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-gold tracking-wide mb-4">
              Shop by Concern
            </h3>
            <ul className="space-y-2.5 text-sm text-cream/75">
              {HEALTH_CONCERNS.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/shop?concern=${encodeURIComponent(c.id)}`}
                    className="hover:text-gold transition"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-gold tracking-wide mb-4">
              Customer Care
            </h3>
            <ul className="space-y-2.5 text-sm text-cream/75">
              <li>
                <Link href="/shop" className="hover:text-gold transition">
                  All Formulations
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-gold transition">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-gold transition">
                  My Account &amp; Orders
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-gold transition">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-gold transition">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-gold tracking-wide mb-4">
              Reach Our Apothecary
            </h3>
            <ul className="space-y-3 text-sm text-cream/75">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <a href={`mailto:${settings.supportEmail}`} className="hover:text-gold transition">
                  {settings.supportEmail}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <a
                  href={`https://wa.me/${settings.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-gold transition"
                >
                  +{settings.whatsappNumber}
                </a>
              </li>
              {settings.instagramUrl && (
                <li className="pt-1">
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 hover:bg-gold hover:text-forest transition text-xs font-semibold"
                  >
                    <Instagram className="w-4 h-4" /> Follow on Instagram
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream/60">
          <p>© {new Date().getFullYear()} {settings.storeName} Ayurveda. All rights reserved.</p>
          <p>Crafted with purity in India • INR (₹) • Cash on Delivery &amp; UPI Accepted</p>
        </div>
      </div>
    </footer>
  );
}
