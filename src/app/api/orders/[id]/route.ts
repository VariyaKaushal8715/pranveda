import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const nextStatus = body.orderStatus ? String(body.orderStatus).toUpperCase() : existing.orderStatus;
    const nextPaymentStatus = body.paymentStatus
      ? String(body.paymentStatus).toUpperCase()
      : existing.paymentStatus;
    const nextTrackingNote =
      body.trackingNote !== undefined
        ? String(body.trackingNote).trim() || null
        : existing.trackingNote;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: nextStatus,
        paymentStatus: nextPaymentStatus,
        trackingNote: nextTrackingNote,
      },
      include: { items: true },
    });

    // Notify customer via email whenever order status changes or admin explicitly checks notify
    if (nextStatus !== existing.orderStatus || body.notifyCustomer === true) {
      try {
        await sendOrderStatusUpdateEmail(updated);
      } catch (e) {
        console.error("Status update email error:", e);
      }
    }

    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error("PATCH /api/orders/[id] error:", err);
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
