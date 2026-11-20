"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CartItem, Product, StoreSettings, UserProfile } from "@/types/store";

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface StoreContextValue {
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  user: UserProfile | null;
  userLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  wishlistIds: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  settings: StoreSettings;
  refreshSettings: () => Promise<void>;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const DEFAULT_SETTINGS: StoreSettings = {
  id: "default",
  storeName: "PranVeda",
  tagline: "Ancient Wisdom, Pure Vitality",
  whatsappNumber: "919876543210",
  supportEmail: "care@pranveda.in",
  address: "104 Botanical Arcade, SG Highway, Ahmedabad, Gujarat 380054",
  instagramUrl: "https://instagram.com/pranveda.ayurveda",
  freeShippingThreshold: 499,
  shippingFee: 49,
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    []
  );

  // Hydrate cart from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pranveda_cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch {
      // ignore
    } finally {
      setCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (cartLoaded) {
      localStorage.setItem("pranveda_cart", JSON.stringify(cart));
    }
  }, [cart, cartLoaded]);

  const refreshWishlist = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist");
      if (res.ok) {
        const data = await res.json();
        setWishlistIds(Array.isArray(data.productIds) ? data.productIds : []);
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setUserLoading(true);
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        if (data.user) {
          await refreshWishlist();
        } else {
          setWishlistIds([]);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  }, [refreshWishlist]);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch {
      // keep default
    }
  }, []);

  useEffect(() => {
    refreshUser();
    refreshSettings();
  }, [refreshUser, refreshSettings]);

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      if (product.stock <= 0) {
        showToast("This formulation is currently out of stock.", "error");
        return;
      }
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          const nextQty = Math.min(product.stock, existing.quantity + quantity);
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: nextQty } : i
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            packSize: product.packSize,
            image: product.images[0] || "/images/ashwagandha.jpg",
            quantity: Math.min(product.stock, quantity),
            stock: product.stock,
          },
        ];
      });
      setCartOpen(true);
      showToast(`Added ${product.name} to your bag`, "success");
    },
    [showToast]
  );

  const updateCartQty = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(i.stock || 20, quantity) }
          : i
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setWishlistIds([]);
    showToast("Signed out safely.", "info");
  }, [showToast]);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!user) {
        showToast("Please sign in to save items to your wishlist.", "info");
        return;
      }
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.wishlisted) {
          setWishlistIds((prev) => [...new Set([...prev, productId])]);
          showToast("Saved to your wishlist", "success");
        } else {
          setWishlistIds((prev) => prev.filter((id) => id !== productId));
          showToast("Removed from wishlist", "info");
        }
      }
    },
    [user, showToast]
  );

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        cart,
        cartCount,
        cartSubtotal,
        cartOpen,
        setCartOpen,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        user,
        userLoading,
        refreshUser,
        logout,
        wishlistIds,
        toggleWishlist,
        settings,
        refreshSettings,
        showToast,
      }}
    >
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-full px-5 py-2.5 text-sm font-medium shadow-xl border transition-all ${
              t.type === "error"
                ? "bg-[#8A2C2C] text-white border-[#B44C4C]"
                : t.type === "info"
                  ? "bg-white text-forest border-sand"
                  : "bg-forest text-cream border-gold/40"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
