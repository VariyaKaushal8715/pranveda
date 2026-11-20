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
      aria-label="Chat on WhatsApp"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2 bg-[#1F6E43] text-white p-3 sm:pl-4 sm:pr-4 sm:py-3 rounded-full shadow-xl hover:bg-[#195936] hover:scale-105 transition-all border border-white/20"
    >
      <MessageCircle className="w-5 h-5 fill-white/15" />
      <span className="hidden sm:inline text-xs font-semibold tracking-wide">
        Ayurveda Support
      </span>
    </a>
  );
}
