import crypto from "crypto";

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
}

export function isRazorpayConfigured(settings?: {
  razorpayKeyId?: string | null;
  razorpayKeySecret?: string | null;
  razorpayEnabled?: boolean;
}): boolean {
  if (settings) {
    if (
      settings.razorpayEnabled !== false &&
      settings.razorpayKeyId?.trim() &&
      settings.razorpayKeySecret?.trim()
    ) {
      return true;
    }
  }

  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() &&
      process.env.RAZORPAY_KEY_SECRET?.trim()
  );
}

export function getRazorpayCredentials(settings?: {
  razorpayKeyId?: string | null;
  razorpayKeySecret?: string | null;
  razorpayEnabled?: boolean;
}): RazorpayCredentials | null {
  if (settings) {
    if (
      settings.razorpayEnabled !== false &&
      settings.razorpayKeyId?.trim() &&
      settings.razorpayKeySecret?.trim()
    ) {
      return {
        keyId: settings.razorpayKeyId.trim(),
        keySecret: settings.razorpayKeySecret.trim(),
      };
    }
  }

  const envKey = process.env.RAZORPAY_KEY_ID?.trim();
  const envSec = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (envKey && envSec) {
    return { keyId: envKey, keySecret: envSec };
  }

  return null;
}

export async function createRazorpayOrder(
  amountINR: number,
  receipt: string,
  settings?: {
    razorpayKeyId?: string | null;
    razorpayKeySecret?: string | null;
    razorpayEnabled?: boolean;
  }
) {
  const creds = getRazorpayCredentials(settings);

  if (!creds) {
    // Demo mode order
    return {
      mode: "demo" as const,
      id: `order_demo_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: Math.round(amountINR * 100),
      currency: "INR",
      keyId: "rzp_test_demo_pranveda",
    };
  }

  const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amountINR * 100),
      currency: "INR",
      receipt,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Razorpay order creation failed: ${errText}`);
  }

  const data = await res.json();
  return {
    mode: "live" as const,
    id: data.id as string,
    amount: data.amount as number,
    currency: data.currency as string,
    keyId: creds.keyId,
  };
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secretOverride?: string | null
): boolean {
  const keySecret = secretOverride?.trim() || process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keySecret) {
    // In demo mode, accept demo signatures starting with sig_demo_
    return signature.startsWith("sig_demo_");
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}
