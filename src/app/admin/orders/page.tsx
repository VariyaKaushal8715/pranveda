"use client";

import React, { useEffect, useState } from "react";
import { MailCheck, Save } from "lucide-react";
import type { OrderData } from "@/types/store";
import { formatINR } from "@/lib/format";
import { useStore } from "@/context/StoreContext";

const STATUSES = ["PLACED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"];

export default function AdminOrdersPage() {
  const { showToast } = useStore();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<
    Record<string, { orderStatus: string; paymentStatus: string; trackingNote: string }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?scope=all");
      if (res.ok) {
        const data = await res.json();
        const list: OrderData[] = data.orders || [];
        setOrders(list);
        const init: typeof edits = {};
        for (const o of list) {
          init[o.id] = {
            orderStatus: o.orderStatus,
            paymentStatus: o.paymentStatus,
            trackingNote: o.trackingNote || "",
          };
        }
        setEdits(init);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const saveOrder = async (orderId: string) => {
    const state = edits[orderId];
    if (!state) return;
    setSavingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...state,
          notifyCustomer: true,
        }),
      });
      if (!res.ok) {
        showToast("Could not update order", "error");
        return;
      }
      showToast("Order updated & status email notification sent to customer!", "success");
      await loadOrders();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Fulfillment</p>
        <h1 className="font-serif text-4xl font-bold text-forest">Customer Orders</h1>
        <p className="text-xs text-muted mt-1">
          Updating an order&apos;s status automatically triggers a branded email notification to the customer.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted py-12">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-sand p-10 text-center text-muted text-sm">
          No orders yet.
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const edit = edits[order.id] || {
              orderStatus: order.orderStatus,
              paymentStatus: order.paymentStatus,
              trackingNote: order.trackingNote || "",
            };
            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-sand p-6 shadow-xs space-y-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-sand/70">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-2xl font-bold text-forest">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : order.paymentStatus === "FAILED"
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {order.paymentMethod === "RAZORPAY" ? "UPI / ONLINE" : order.paymentMethod} • {order.paymentStatus}
                      </span>
                    </div>

                    {order.razorpayPaymentId && (
                      <div className="mt-2 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-linen border border-sand text-xs text-forest">
                        <span className="font-bold text-muted uppercase text-[10px] tracking-wider">
                          Customer UPI Ref / UTR:
                        </span>
                        <code className="font-mono font-bold text-forest bg-white px-2 py-0.5 rounded border border-sand">
                          {order.razorpayPaymentId.replace(/^upi_/, "")}
                        </code>
                        {order.paymentStatus !== "PAID" && (
                          <button
                            type="button"
                            onClick={async () => {
                              const newEdits = {
                                ...edits,
                                [order.id]: { ...edit, paymentStatus: "PAID" },
                              };
                              setEdits(newEdits);
                              setSavingId(order.id);
                              try {
                                const res = await fetch("/api/admin/orders", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    orderId: order.id,
                                    orderStatus: edit.orderStatus,
                                    paymentStatus: "PAID",
                                    trackingNote: edit.trackingNote,
                                  }),
                                });
                                if (res.ok) {
                                  showToast(`Order #${order.orderNumber} payment verified & marked PAID!`, "success");
                                  loadOrders();
                                }
                              } finally {
                                setSavingId(null);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#1F6E43] text-white text-[11px] font-bold hover:bg-[#185936] transition cursor-pointer shadow-2xs"
                          >
                            ✓ Verify &amp; Approve Payment
                          </button>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-muted mt-1">
                      {new Date(order.createdAt).toLocaleString("en-IN")} •{" "}
                      <strong>{order.customerName}</strong> ({order.customerEmail} •{" "}
                      {order.customerPhone})
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      Ship to: {order.shippingAddress}, {order.shippingCity}, {order.shippingState} -{" "}
                      {order.shippingPincode}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-sans text-3xl font-extrabold text-forest tabular-nums tracking-tight">
                      {formatINR(order.total)}
                    </div>
                    {order.couponCode && (
                      <div className="text-xs text-[#1F6E43]">
                        Coupon {order.couponCode} (-{formatINR(order.discount)})
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-wrap gap-2.5">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-cream border border-sand/70 text-xs"
                    >
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      )}
                      <span className="font-semibold text-forest">{item.productName}</span>
                      <span className="text-muted">
                        ×{item.quantity} ({formatINR(item.price)})
                      </span>
                    </div>
                  ))}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 items-end">
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                      Order Status
                    </label>
                    <select
                      value={edit.orderStatus}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [order.id]: { ...edit, orderStatus: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-sand bg-cream/60 px-3 py-2 text-xs font-semibold text-forest"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                      Payment
                    </label>
                    <select
                      value={edit.paymentStatus}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [order.id]: { ...edit, paymentStatus: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-sand bg-cream/60 px-3 py-2 text-xs font-semibold text-forest"
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                      Tracking / Dispatch Note (Included in Email)
                    </label>
                    <input
                      value={edit.trackingNote}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [order.id]: { ...edit, trackingNote: e.target.value },
                        }))
                      }
                      placeholder="e.g., Shipped via BlueDart AWB #12345"
                      className="w-full rounded-xl border border-sand bg-cream/60 px-3.5 py-2 text-xs"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <button
                      disabled={savingId === order.id}
                      onClick={() => saveOrder(order.id)}
                      className="w-full py-2.5 px-4 rounded-full bg-forest text-cream text-xs font-bold hover:bg-forest-light disabled:opacity-50 transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {savingId === order.id ? (
                        "Updating..."
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 text-gold" /> Save &amp; Notify{" "}
                          <MailCheck className="w-3.5 h-3.5 text-gold" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
