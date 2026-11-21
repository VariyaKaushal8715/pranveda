"use client";

import React, { useEffect, useState } from "react";
import { Save, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function AdminSettingsPage() {
  const { refreshSettings, showToast } = useStore();
  const [form, setForm] = useState({
    storeName: "PranVeda",
    tagline: "Ancient Wisdom, Pure Vitality",
    whatsappNumber: "919876543210",
    supportEmail: "care@pranveda.in",
    address: "",
    instagramUrl: "",
    upiId: "pranveda@okhdfcbank",
    upiName: "PranVeda Apothecary",
    upiEnabled: false,
    razorpayKeyId: "",
    razorpayKeySecret: "",
    razorpayEnabled: true,
    freeShippingThreshold: 499,
    shippingFee: 49,
  });
  const [showSecret, setShowSecret] = useState(false);
  const [integrations, setIntegrations] = useState({ razorpayLive: false, smtpLive: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setForm((prev) => ({
            ...prev,
            ...d.settings,
            razorpayKeyId: d.settings.razorpayKeyId || "",
            razorpayKeySecret: d.settings.razorpayKeySecret || "",
            razorpayEnabled: d.settings.razorpayEnabled !== false,
            upiEnabled: Boolean(d.settings.upiEnabled),
          }));
        }
        if (d.integrations) setIntegrations(d.integrations);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await refreshSettings();
        showToast("Store settings saved across your storefront!", "success");
      } else {
        showToast("Failed to save settings", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Configuration</p>
        <h1 className="font-serif text-4xl font-bold text-forest">Store Settings</h1>
        <p className="text-xs text-muted mt-1">
          Replace placeholder contact info, WhatsApp number, email, and shipping rules anytime from here.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl border border-sand p-6 sm:p-8 shadow-xs space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">Brand Name</label>
            <input
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">Tagline</label>
            <input
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              WhatsApp Number (with country code, e.g., 919876543210)
            </label>
            <input
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Support &amp; Admin Alert Email
            </label>
            <input
              type="email"
              value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-forest mb-1">Store Address</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-forest mb-1">Instagram URL</label>
          <input
            value={form.instagramUrl}
            onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
            className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm"
          />
        </div>

        {/* Razorpay Online Payment Gateway Configuration */}
        <div className="pt-4 border-t border-sand space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    form.razorpayKeyId && form.razorpayKeySecret && form.razorpayEnabled
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-amber-400"
                  }`}
                />
                <h3 className="text-sm font-bold text-forest uppercase tracking-wider">
                  Razorpay Payment Gateway (Instant Automated Verification)
                </h3>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Enter your Razorpay credentials below. Customer online payments (UPI, GPay, PhonePe, Cards, NetBanking) will be directly credited to your Razorpay account with 100% automated bank verification!
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-forest cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.razorpayEnabled}
                onChange={(e) => setForm({ ...form, razorpayEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-forest focus:ring-forest"
              />
              Enable Razorpay
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Razorpay Key ID (e.g. rzp_live_... or rzp_test_...)
              </label>
              <input
                type="text"
                placeholder="rzp_live_xxxxxxxxxxxxxxxx"
                value={form.razorpayKeyId}
                onChange={(e) => setForm({ ...form, razorpayKeyId: e.target.value.trim() })}
                className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Razorpay Key Secret
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  placeholder="Enter your Razorpay Key Secret"
                  value={form.razorpayKeySecret}
                  onChange={(e) => setForm({ ...form, razorpayKeySecret: e.target.value.trim() })}
                  className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:border-forest"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-forest transition"
                  aria-label="Toggle secret visibility"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-linen border border-sand/80 text-[11px] text-muted flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <div>
              <strong>Where to find your Razorpay API Keys?</strong> Log in to your{" "}
              <a
                href="https://dashboard.razorpay.com/app/keys"
                target="_blank"
                rel="noreferrer"
                className="text-forest font-bold underline"
              >
                Razorpay Dashboard → Settings → API Keys
              </a>
              , click &quot;Generate Key&quot;, and paste your Key ID and Key Secret here. Instant live activation without touching code or redeploying!
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-sand">
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Free Shipping Above (₹)
            </label>
            <input
              type="number"
              min={0}
              value={form.freeShippingThreshold}
              onChange={(e) =>
                setForm({ ...form, freeShippingThreshold: Number(e.target.value) })
              }
              className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Standard Shipping Fee (₹)
            </label>
            <input
              type="number"
              min={0}
              value={form.shippingFee}
              onChange={(e) => setForm({ ...form, shippingFee: Number(e.target.value) })}
              className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-forest text-cream text-sm font-bold hover:bg-forest-light disabled:opacity-50 transition cursor-pointer"
        >
          <Save className="w-4 h-4 text-gold" /> {saving ? "Saving..." : "Save Store Settings"}
        </button>
      </form>

      {/* Go-Live Credentials Guide */}
      <div className="bg-forest text-cream rounded-3xl p-6 sm:p-8 border border-gold/30 space-y-4">
        <div className="flex items-center gap-2.5">
          <KeyRound className="w-5 h-5 text-gold" />
          <h2 className="font-serif text-2xl font-bold">
            Switching from Demo to Live Credentials (.env)
          </h2>
        </div>
        <p className="text-xs text-cream/80 leading-relaxed">
          Whenever you are ready to accept real Razorpay/UPI payments and deliver real SMTP emails
          to customer inboxes, simply update the keys inside your project&apos;s{" "}
          <code className="text-gold">.env</code> file and restart the server:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-1.5">
            <div className="font-bold text-gold">
              Razorpay Status: {integrations.razorpayLive ? "LIVE" : "DEMO MODE"}
            </div>
            <pre className="font-mono text-[11px] text-cream/85 overflow-x-auto">{`RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="your_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..."`}</pre>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-1.5">
            <div className="font-bold text-gold">
              Email SMTP Status: {integrations.smtpLive ? "LIVE" : "DEMO LOG MODE"}
            </div>
            <pre className="font-mono text-[11px] text-cream/85 overflow-x-auto">{`SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="you@gmail.com"
SMTP_PASS="your-app-password"`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
