"use client";

import React, { useEffect, useState } from "react";
import { Mail, Eye, Send, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useStore } from "@/context/StoreContext";

interface EmailLogItem {
  id: string;
  to: string;
  subject: string;
  type: string;
  html: string;
  status: string;
  error?: string | null;
  createdAt: string;
}

export default function AdminEmailsPage() {
  const { showToast } = useStore();
  const [emails, setEmails] = useState<EmailLogItem[]>([]);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewEmail, setPreviewEmail] = useState<EmailLogItem | null>(null);
  const [testTo, setTestTo] = useState("customer@pranveda.in");
  const [sendingTest, setSendingTest] = useState(false);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/emails");
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
        setSmtpConfigured(Boolean(data.smtpConfigured));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const sendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo }),
      });
      if (res.ok) {
        showToast(
          smtpConfigured
            ? `Real test email sent to ${testTo}!`
            : `Demo email generated & logged for ${testTo}!`,
          "success"
        );
        await loadEmails();
      }
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Automated Customer Notifications
          </p>
          <h1 className="font-serif text-4xl font-bold text-forest">Email Notification Logs</h1>
          <p className="text-xs text-muted mt-1">
            Every customer Welcome, Order Confirmation, and Order Status Update email is tracked here.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border ${
            smtpConfigured
              ? "bg-[#1F6E43]/15 text-[#1F6E43] border-[#1F6E43]/30"
              : "bg-gold/15 text-forest border-gold/40"
          }`}
        >
          {smtpConfigured ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Live SMTP Active
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-gold" /> Demo Log Mode (Add SMTP in .env to deliver live)
            </>
          )}
        </span>
      </div>

      {/* Send Test Email */}
      <form
        onSubmit={sendTestEmail}
        className="bg-white rounded-3xl border border-sand p-5 flex flex-wrap items-center gap-3 shadow-xs"
      >
        <Mail className="w-5 h-5 text-gold shrink-0" />
        <span className="text-xs font-semibold text-forest">Trigger Test Branded Email:</span>
        <input
          type="email"
          required
          value={testTo}
          onChange={(e) => setTestTo(e.target.value)}
          placeholder="recipient@example.com"
          className="flex-1 min-w-[200px] rounded-full border border-sand bg-cream/60 px-4 py-2 text-xs"
        />
        <button
          type="submit"
          disabled={sendingTest}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-forest text-cream text-xs font-bold hover:bg-forest-light cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 text-gold" /> {sendingTest ? "Sending..." : "Send Test"}
        </button>
      </form>

      {/* Email Logs Table */}
      <div className="bg-white rounded-3xl border border-sand overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-sm text-muted">Loading email logs...</div>
        ) : emails.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">
            No emails triggered yet. Register a user, place an order, or click &ldquo;Send Test&rdquo; above to preview PranVeda&apos;s branded emails!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-linen/70 border-b border-sand text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Recipient</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Time</th>
                  <th className="px-5 py-3.5 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/70">
                {emails.map((item) => (
                  <tr key={item.id} className="hover:bg-cream/50">
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-linen text-forest text-[11px] font-bold">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-forest">{item.to}</td>
                    <td className="px-5 py-3.5 text-ink/85 max-w-xs truncate">{item.subject}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.status === "SENT"
                            ? "bg-[#1F6E43]/15 text-[#1F6E43]"
                            : item.status === "FAILED"
                              ? "bg-terracotta/15 text-terracotta"
                              : "bg-gold/20 text-forest"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setPreviewEmail(item)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-forest text-cream text-xs font-semibold hover:bg-forest-light cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-gold" /> View HTML
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email HTML Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-sand">
            <div className="px-6 py-4 border-b border-sand flex items-center justify-between bg-linen/60">
              <div className="min-w-0">
                <div className="text-xs text-muted">To: {previewEmail.to}</div>
                <div className="font-serif text-xl font-bold text-forest truncate">
                  {previewEmail.subject}
                </div>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="p-2 rounded-full hover:bg-sand/50 text-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#FAF6F0]">
              <iframe
                title="Email Preview"
                srcDoc={previewEmail.html}
                className="w-full h-[65vh] border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
