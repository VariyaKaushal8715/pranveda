"use client";

import React, { useState } from "react";
import { ShieldCheck, Eye, EyeOff, X, Lock, AlertCircle } from "lucide-react";

interface AdminVerifyModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  actionButtonText?: string;
  onClose: () => void;
  onVerified: (password: string) => Promise<void> | void;
}

export function AdminVerifyModal({
  isOpen,
  title = "Admin Password Verification",
  description = "Please enter your administrator password to authorize and commit this change.",
  actionButtonText = "Verify & Save Changes",
  onClose,
  onVerified,
}: AdminVerifyModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = password.trim();
    if (!cleanPass) {
      setError("Please enter your admin password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Verify against real server bcrypt hash
      const res = await fetch("/api/admin/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: cleanPass }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Incorrect admin password. Verification failed.");
        return;
      }

      // 2. Real verification succeeded, pass verified password to execute action
      await onVerified(cleanPass);
      setPassword("");
      setError(null);
      onClose();
    } catch (err) {
      console.error("Admin verification error:", err);
      setError("Verification failed. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setPassword("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] sm:rounded-[36px] max-w-md w-full overflow-hidden shadow-2xl border border-sand my-auto">
        {/* Modal Header */}
        <div className="bg-forest text-cream px-6 py-5 border-b border-gold/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/40 text-gold flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-gold font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Real Security Gate
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight mt-0.5">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-full text-cream/70 hover:text-cream hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-muted leading-relaxed">{description}</p>

          {error && (
            <div className="p-3.5 rounded-2xl bg-terracotta/10 border border-terracotta/30 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
              <div className="text-xs font-semibold text-terracotta leading-tight">{error}</div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-forest uppercase tracking-wider">
              Admin Password
            </label>
            <div className="relative">
              <input
                autoFocus
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter your admin password"
                className="w-full rounded-xl border border-sand bg-cream/50 px-4 py-3 pr-11 text-sm font-mono text-ink placeholder:text-muted/60 focus:outline-none focus:border-forest shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-forest transition cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-linen border border-sand text-[11px] text-muted flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>
              Real server-side cryptographic verification (bcrypt hash).
            </span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="px-4 py-2.5 rounded-full border border-sand text-xs font-semibold text-muted hover:text-forest transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-5 rounded-full bg-forest text-gold text-xs sm:text-sm font-bold hover:bg-forest-light disabled:opacity-50 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {loading ? "Verifying Password..." : actionButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
