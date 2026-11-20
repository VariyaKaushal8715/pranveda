import crypto from "crypto";

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_KEY_ID.trim() !== "" &&
      process.env.RAZORPAY_KEY_SECRET.trim() !== ""
  );
}

export async function createRazorpayOrder(amountINR: number, receipt: string) {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    // Demo mode order
    return {
      mode: "demo" as const,
      id: `order_demo_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: amountINR * 100,
      currency: "INR",
      keyId: "rzp_test_demo_pranveda",
    };
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
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
    keyId,
  };
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
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
