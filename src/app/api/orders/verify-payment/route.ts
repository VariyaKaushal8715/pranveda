import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = String(body.orderId || "");
    const isUpi = body.isUpiPayment === true || body.paymentType === "UPI";
    const upiRef = String(body.upiRef || body.razorpayPaymentId || "").trim();

    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (!isUpi) {
      const razorpayOrderId = String(body.razorpayOrderId || "");
      const razorpayPaymentId = String(body.razorpayPaymentId || "");
      const razorpaySignature = String(body.razorpaySignature || "");

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json({ error: "Missing Razorpay verification fields." }, { status: 400 });
      }

      const valid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!valid) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "FAILED" },
        });
        return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
      }
    }

    const alreadyPaid = order.paymentStatus === "PAID";
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        razorpayPaymentId: isUpi
          ? (upiRef ? `upi_${upiRef}` : `upi_qr_${Date.now()}`)
          : body.razorpayPaymentId,
      },
      include: { items: true },
    });

    if (!alreadyPaid) {
      for (const item of updated.items) {
        if (item.productId) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Asynchronous email dispatch (instant payment verification response)
      sendOrderConfirmationEmail(updated).catch((e) => {
        console.error("Order paid email error:", e);
      });
    }

    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error("POST /api/orders/verify-payment error:", err);
    return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
  }
}
