import React from "react";
import Link from "next/link";
import { Leaf, ArrowRight, Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-cream">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Sacred Icon Medallion */}
        <div className="w-20 h-20 mx-auto rounded-full bg-forest text-gold flex items-center justify-center shadow-lg border border-gold/30">
          <Leaf className="w-10 h-10 animate-pulse" />
        </div>

        {/* Status Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-bold uppercase tracking-[0.2em]">
          ✦ 404 • Lost in the Sacred Groves
        </div>

        {/* Heading */}
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-forest leading-tight">
          Page Not Found
        </h1>

        {/* Protective description — zero internal error leak */}
        <p className="text-sm sm:text-base text-muted leading-relaxed max-w-md mx-auto">
          The Ayurvedic formulation or page you are seeking does not exist or may have been moved.
          Let us guide you back to your wellness journey.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-forest text-cream font-bold text-xs sm:text-sm hover:bg-forest-light transition shadow-md"
          >
            <Home className="w-4 h-4 text-gold" />
            Return to Home
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-forest border border-sand font-bold text-xs sm:text-sm hover:border-gold hover:text-gold transition shadow-xs"
          >
            <Compass className="w-4 h-4 text-gold" />
            Explore Formulations
          </Link>
        </div>

        <div className="pt-6 border-t border-sand/70 text-xs text-muted">
          Need assistance? Our Ayurvedic care team is always here to help.
        </div>
      </div>
    </div>
  );
}
