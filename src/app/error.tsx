"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log privately to internal telemetry/console without leaking to UI
    console.error("PranVeda Application Boundary Handled Error:", error.message);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-cream">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Shield Icon Medallion */}
        <div className="w-20 h-20 mx-auto rounded-full bg-forest text-gold flex items-center justify-center shadow-lg border border-gold/30">
          <ShieldAlert className="w-10 h-10" />
        </div>

        {/* Status Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-bold uppercase tracking-[0.2em]">
          ✦ A Moment of Disharmony
        </div>

        {/* Heading */}
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-forest leading-tight">
          Harmonizing Your Experience
        </h1>

        {/* Sanitized Public Message — Zero code leak or stack trace */}
        <p className="text-sm sm:text-base text-muted leading-relaxed max-w-md mx-auto">
          Our apothecary servers experienced a brief disruption. Your session and information remain completely secure.
          Please refresh to realign your wellness ritual.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-forest text-cream font-bold text-xs sm:text-sm hover:bg-forest-light transition shadow-md cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-gold" />
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-forest border border-sand font-bold text-xs sm:text-sm hover:border-gold hover:text-gold transition shadow-xs"
          >
            <Home className="w-4 h-4 text-gold" />
            Return to Store
          </Link>
        </div>

        {error.digest && (
          <div className="pt-4 text-[11px] text-muted font-mono">
            Incident Reference: {error.digest}
          </div>
        )}
      </div>
    </div>
  );
}
