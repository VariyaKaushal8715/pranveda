"use client";

import React from "react";

const ITEMS = [
  "100% PURE HIMALAYAN HERBS",
  "CLASSICAL ASHTANGA HRIDAYA RECIPES",
  "ZERO ARTIFICIAL PRESERVATIVES OR REFINED SUGAR",
  "3RD-PARTY HEAVY METAL TESTED",
  "COLD-PRESSED & 18-HR KSHIRAPAKA INFUSED",
  "FAST DISPATCH ACROSS INDIA & CASH ON DELIVERY",
  "SMALL-BATCH HANDCRAFTED APOTHECARY",
];

export function MarqueeTicker() {
  return (
    <div className="bg-[#142C20] text-cream py-3.5 border-y border-gold/30 overflow-hidden select-none">
      <div className="flex w-max animate-marquee space-x-8">
        {[...ITEMS, ...ITEMS].map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 text-xs tracking-[0.2em] font-bold text-cream/90 uppercase"
          >
            <span className="text-gold font-bold">✦</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
