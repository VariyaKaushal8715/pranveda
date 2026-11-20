"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  ShoppingBag,
  Leaf,
  MessageSquare,
  Bot,
  User,
  CheckCircle2,
  Minimize2,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/format";

interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  subtitle?: string | null;
  price: number;
  image: string;
  packSize: string;
  doshaTag: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  suggestedProducts?: ProductCardData[];
  followUps?: string[];
}

const INITIAL_PROMPTS = [
  "🌙 મને રાત્રે ઊંઘ નથી આવતી અને ચિંતા રહે છે",
  "🔥 Acidity and digestion problems",
  "✨ Natural glowing skin tips",
  "🌿 How to take Ashwagandha correctly?",
];

export function AIVaidyaChat() {
  const pathname = usePathname();
  const { addToCart, showToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `નમસ્તે (Namaste)! I am your **PranVeda AI Vaidya**.

Unlike simple product bots, I analyze your unique Ayurvedic constitution (**Vata, Pitta, Kapha**), explain the root cause of your symptoms, and recommend holistic dietary rituals (*Ahara*), daily lifestyle practices (*Dinacharya*), and pure herbal remedies.

What health concern or question may I help you with today?`,
      followUps: INITIAL_PROMPTS,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch("/api/ai-vaidya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not reach AI Vaidya", "error");
        return;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        text: data.message,
        suggestedProducts: data.suggestedProducts || [],
        followUps: data.followUps || [],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (prod: ProductCardData) => {
    // Adapter for addToCart
    addToCart(
      {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        subtitle: prod.subtitle,
        description: "",
        price: prod.price,
        compareAtPrice: null,
        packSize: prod.packSize,
        stock: 50,
        categoryId: "",
        category: { id: "", name: "Ayurveda", slug: "ayurveda" },
        concerns: [],
        images: [prod.image],
        isFeatured: false,
        isBestSeller: true,
        isActive: true,
        reviewCount: 5,
        avgRating: 5.0,
      },
      1
    );
  };

  return (
    <>
      {/* Floating Toggle Button (Right Side Dock) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2 bg-forest text-cream pl-3 pr-3.5 sm:pl-3.5 sm:pr-4 py-2 sm:py-2.5 rounded-full shadow-2xl hover:bg-forest-light hover:scale-105 transition-all border border-gold/45 cursor-pointer backdrop-blur-xs"
        aria-label="Open Ayurvedic AI Vaidya"
      >
        <div className="relative">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div className="text-left">
          <div className="text-[11px] sm:text-xs font-bold tracking-wide text-cream flex items-center gap-1 sm:gap-1.5">
            AI Vaidya <span className="text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded-full bg-gold text-forest font-extrabold uppercase">Live</span>
          </div>
          <div className="text-[9px] sm:text-[10px] text-gold font-medium leading-none hidden sm:block">
            Ayurvedic Consultation
          </div>
        </div>
      </button>

      {/* Slide-out Consultation Window (Aligned to Right) */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-6 sm:w-[420px] sm:h-[620px] z-50 bg-white sm:rounded-3xl shadow-2xl border border-sand flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-forest text-cream px-5 py-4 border-b border-gold/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/40 text-gold flex items-center justify-center">
                <Leaf className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="font-serif text-lg font-bold flex items-center gap-1.5 text-cream">
                  PranVeda AI Vaidya
                </div>
                <div className="text-[10px] uppercase tracking-wider text-gold font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F6E43]" />
                  Clinical &amp; Lifestyle Diagnosis
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-cream/70 hover:text-cream hover:bg-white/10 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader Notice */}
          <div className="bg-linen/80 px-4 py-2 border-b border-sand/70 text-[11px] text-muted flex items-center justify-between">
            <span>🌿 Understands Gujarati, Hindi &amp; English</span>
            <span className="text-forest font-semibold">Tridosha Diagnostic</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF7F2]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-forest text-gold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-forest text-cream font-medium rounded-tr-xs"
                      : "bg-white text-ink border border-sand shadow-xs rounded-tl-xs"
                  }`}
                >
                  <div className="whitespace-pre-line prose-xs">{msg.text}</div>

                  {/* Inline Product Cards */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-sand/70 space-y-2.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-forest flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-gold" /> Recommended Formulation
                      </div>
                      <div className="space-y-2">
                        {msg.suggestedProducts.map((p) => (
                          <div
                            key={p.id}
                            className="p-2.5 rounded-xl bg-linen/70 border border-sand/80 flex items-center gap-2.5"
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-12 rounded-lg object-cover border border-sand shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-bold uppercase text-gold block truncate">
                                {p.doshaTag}
                              </span>
                              <Link
                                href={`/product/${p.slug}`}
                                onClick={() => setIsOpen(false)}
                                className="font-serif text-xs font-bold text-forest hover:text-gold transition truncate block leading-tight"
                              >
                                {p.name}
                              </Link>
                              <div className="text-xs font-bold text-forest mt-0.5 font-sans tabular-nums">
                                {formatINR(p.price)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddProduct(p)}
                              className="px-2.5 py-1.5 rounded-full bg-forest text-cream text-[10px] font-bold hover:bg-forest-light shrink-0 transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <ShoppingBag className="w-3 h-3 text-gold" /> Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Prompts */}
                  {msg.followUps && msg.followUps.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-sand/60 flex flex-wrap gap-1.5">
                      {msg.followUps.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(prompt)}
                          className="px-2.5 py-1 rounded-full bg-cream border border-sand text-[11px] text-forest font-semibold hover:border-gold hover:bg-gold/10 transition cursor-pointer text-left"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-gold/30 text-forest flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-xs text-muted">
                <div className="w-7 h-7 rounded-full bg-forest text-gold flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white rounded-2xl px-4 py-2.5 border border-sand shadow-xs inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-forest font-medium ml-1">Analyzing Ayurvedic doshas...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-sand">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about stress, acidity, hair, diet..."
                className="flex-1 rounded-full border border-sand bg-cream/60 px-4 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-forest"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-full bg-forest text-gold flex items-center justify-center hover:bg-forest-light disabled:opacity-40 transition shrink-0 cursor-pointer shadow-xs"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
