"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/format";

interface CouponItem {
  id: string;
  code: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  isActive: boolean;
  usageCount: number;
}

export default function AdminCouponsPage() {
  const { showToast } = useStore();
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState("");
  const [creating, setCreating] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons");
      const data = await res.json();
      setCoupons(data.coupons || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue,
          minOrderAmount,
          maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to create coupon", "error");
        return;
      }
      showToast(`Coupon ${data.coupon.code} created!`, "success");
      setCode("");
      setMaxDiscount("");
      await loadCoupons();
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (c: CouponItem) => {
    const res = await fetch(`/api/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (res.ok) {
      showToast(`Coupon ${c.code} ${!c.isActive ? "enabled" : "paused"}`, "info");
      await loadCoupons();
    }
  };

  const removeCoupon = async (c: CouponItem) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    const res = await fetch(`/api/coupons/${c.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Coupon deleted", "info");
      await loadCoupons();
    }
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Promotions</p>
        <h1 className="font-serif text-4xl font-bold text-forest">Discount Coupons</h1>
      </div>

      {/* Create form */}
      <form
        onSubmit={createCoupon}
        className="bg-white rounded-3xl border border-sand p-6 shadow-xs space-y-4"
      >
        <h2 className="font-serif text-2xl font-bold text-forest flex items-center gap-2">
          <Tag className="w-5 h-5 text-gold" /> Create New Coupon
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">Code *</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FESTIVE20"
              className="w-full rounded-xl border border-sand px-3.5 py-2 text-sm uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FLAT")}
              className="w-full rounded-xl border border-sand px-3 py-2 text-sm bg-white"
            >
              <option value="PERCENT">Percentage (%)</option>
              <option value="FLAT">Flat Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Value ({discountType === "PERCENT" ? "%" : "₹"}) *
            </label>
            <input
              required
              type="number"
              min={1}
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="w-full rounded-xl border border-sand px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">Min Order (₹)</label>
            <input
              type="number"
              min={0}
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-sand px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">Max Cap (₹)</label>
            <input
              type="number"
              min={0}
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-sand px-3.5 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-forest text-cream text-xs font-bold hover:bg-forest-light cursor-pointer"
        >
          <Plus className="w-4 h-4 text-gold" /> {creating ? "Creating..." : "Create Coupon"}
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-3xl border border-sand overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-sm text-muted">Loading coupons...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-linen/70 border-b border-sand text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Discount</th>
                <th className="px-5 py-3.5">Min Order</th>
                <th className="px-5 py-3.5">Uses</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/70">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-4 font-bold tracking-wider text-forest">{c.code}</td>
                  <td className="px-5 py-4">
                    {c.discountType === "PERCENT"
                      ? `${c.discountValue}% OFF`
                      : `${formatINR(c.discountValue)} OFF`}
                    {c.maxDiscount ? ` (up to ${formatINR(c.maxDiscount)})` : ""}
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {c.minOrderAmount > 0 ? formatINR(c.minOrderAmount) : "No minimum"}
                  </td>
                  <td className="px-5 py-4 text-muted">{c.usageCount}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                        c.isActive
                          ? "bg-[#1F6E43]/15 text-[#1F6E43]"
                          : "bg-sand text-muted"
                      }`}
                    >
                      {c.isActive ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => removeCoupon(c)}
                      className="p-2 text-muted hover:text-terracotta cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
