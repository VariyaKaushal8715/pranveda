"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Mail,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import type { OrderData } from "@/types/store";

interface AdminStatsPayload {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    activeProducts: number;
    totalProducts: number;
    customerCount: number;
    emailCount: number;
  };
  lowStockProducts: { id: string; name: string; stock: number; packSize: string }[];
  recentOrders: OrderData[];
  integrations: {
    razorpayLive: boolean;
    smtpLive: boolean;
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminStatsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="text-muted text-sm py-12">Loading PranVeda dashboard metrics...</div>;
  }

  const { stats, lowStockProducts, recentOrders, integrations } = data;

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Store Command Center
          </p>
          <h1 className="font-serif text-4xl font-bold text-forest">Dashboard Overview</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              integrations.razorpayLive
                ? "bg-[#1F6E43]/10 text-[#1F6E43] border-[#1F6E43]/30"
                : "bg-gold/15 text-forest border-gold/40"
            }`}
          >
            Razorpay: {integrations.razorpayLive ? "Live Connected" : "Demo Mode"}
          </span>
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              integrations.smtpLive
                ? "bg-[#1F6E43]/10 text-[#1F6E43] border-[#1F6E43]/30"
                : "bg-gold/15 text-forest border-gold/40"
            }`}
          >
            Email SMTP: {integrations.smtpLive ? "Live Connected" : "Demo Log Mode"}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl border border-sand p-6 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted mb-3">
            <span className="font-semibold uppercase tracking-wider">Total Revenue</span>
            <IndianRupee className="w-5 h-5 text-gold" />
          </div>
          <div className="font-sans text-3xl font-bold text-forest tabular-nums tracking-tight">
            {formatINR(stats.totalRevenue)}
          </div>
          <div className="text-xs text-muted mt-1">{stats.totalOrders} total order(s)</div>
        </div>

        <div className="bg-white rounded-3xl border border-sand p-6 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted mb-3">
            <span className="font-semibold uppercase tracking-wider">Pending Dispatch</span>
            <Clock className="w-5 h-5 text-terracotta" />
          </div>
          <div className="font-serif text-3xl font-bold text-forest">{stats.pendingOrders}</div>
          <Link
            href="/admin/orders"
            className="text-xs text-forest font-semibold hover:text-gold inline-flex items-center gap-1 mt-1"
          >
            Manage orders <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-sand p-6 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted mb-3">
            <span className="font-semibold uppercase tracking-wider">Active Formulations</span>
            <Package className="w-5 h-5 text-gold" />
          </div>
          <div className="font-serif text-3xl font-bold text-forest">
            {stats.activeProducts}{" "}
            <span className="text-base font-sans text-muted">/ {stats.totalProducts}</span>
          </div>
          <Link
            href="/admin/products"
            className="text-xs text-forest font-semibold hover:text-gold inline-flex items-center gap-1 mt-1"
          >
            Add / Replace photos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-sand p-6 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted mb-3">
            <span className="font-semibold uppercase tracking-wider">Email Notifications</span>
            <Mail className="w-5 h-5 text-gold" />
          </div>
          <div className="font-serif text-3xl font-bold text-forest">{stats.emailCount}</div>
          <Link
            href="/admin/emails"
            className="text-xs text-forest font-semibold hover:text-gold inline-flex items-center gap-1 mt-1"
          >
            View email previews <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-3xl border border-sand p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl font-bold text-forest flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gold" /> Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-xs font-bold text-forest hover:text-gold">
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted border-b border-sand">
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/60">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3.5 font-semibold text-forest">#{order.orderNumber}</td>
                    <td className="py-3.5">
                      <div className="font-medium text-ink">{order.customerName}</div>
                      <div className="text-xs text-muted">{order.customerEmail}</div>
                    </td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-linen border border-sand text-[11px] font-bold text-forest">
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold text-forest">
                      {formatINR(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-3xl border border-sand p-6 shadow-xs">
          <h2 className="font-serif text-2xl font-bold text-forest flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-terracotta" /> Low Stock Watch
          </h2>

          {lowStockProducts.length === 0 ? (
            <div className="text-sm text-[#1F6E43] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> All products are well stocked!
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-cream border border-sand/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-forest truncate">{p.name}</div>
                    <div className="text-xs text-muted">{p.packSize}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-terracotta/15 text-terracotta text-xs font-bold shrink-0">
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
