"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export function WhatsAppButton() {
  const pathname = usePathname();
  const { settings } = useStore();

  if (pathname?.startsWith("/admin")) return null;

  const message = encodeURIComponent(
    `Namaste ${settings.storeName} team! I would like guidance on your Ayurvedic formulations.`
  );
  const href = `https://wa.me/${settings.whatsappNumber}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Direct Ayurvedic Care on WhatsApp"
      className="fixed bottom-[68px] right-4 sm:bottom-[78px] sm:right-6 z-40 group flex items-center gap-2 bg-[#142C20]/95 backdrop-blur-md text-cream pl-3 pr-3.5 sm:pl-3.5 sm:pr-4 py-2 rounded-full shadow-xl hover:bg-forest hover:scale-105 transition-all border border-gold/40 hover:border-gold cursor-pointer"
    >
      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0">
        <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
      </div>
      <div className="text-left">
        <div className="text-[11px] sm:text-xs font-semibold tracking-wide text-cream flex items-center gap-1.5">
          Care Team
        </div>
        <div className="text-[9px] sm:text-[10px] text-gold font-medium leading-none hidden sm:block">
          WhatsApp Direct
        </div>
      </div>
    </a>
  );
}
