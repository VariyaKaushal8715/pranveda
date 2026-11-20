import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/settings";
import { generateOrderNumber, parseJsonArray } from "@/lib/format";
import { createRazorpayOrder } from "@/lib/razorpay";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber")?.trim();

  // Public Order Tracking lookup by orderNumber
  if (orderNumber) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found. Please check your Order Number." }, { status: 404 });
    }

    return NextResponse.json({ order });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "ADMIN" && searchParams.get("scope") === "all") {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ userId: user.id }, { customerEmail: user.email }],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const itemsInput: { productId: string; quantity: number }[] = Array.isArray(body.items)
      ? body.items
      : [];

    if (itemsInput.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    const customerName = String(body.customerName || "").trim();
    const customerEmail = String(body.customerEmail || "").trim().toLowerCase();
    const customerPhone = String(body.customerPhone || "").trim();
    const shippingAddress = String(body.shippingAddress || "").trim();
    const shippingCity = String(body.shippingCity || "").trim();
    const shippingState = String(body.shippingState || "").trim();
    const shippingPincode = String(body.shippingPincode || "").trim();
    const paymentMethod = body.paymentMethod === "RAZORPAY" ? "RAZORPAY" : "COD";
    const couponCode = body.couponCode ? String(body.couponCode).trim().toUpperCase() : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !shippingAddress ||
      !shippingCity ||
      !shippingState ||
      !shippingPincode
    ) {
      return NextResponse.json(
        { error: "Please fill in all required shipping details." },
        { status: 400 }
      );
    }

    // Fetch authoritative product records
    const productIds = itemsInput.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotal = 0;
    const validatedItems: {
      productId: string;
      productName: string;
      productImage: string | null;
      packSize: string;
      price: number;
      quantity: number;
    }[] = [];

    for (const item of itemsInput) {
      const product = productMap.get(item.productId);
      const qty = Math.max(1, Math.min(20, Math.round(Number(item.quantity || 1))));
      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: "One or more items in your cart are no longer available." },
          { status: 400 }
        );
      }
      if (product.stock < qty) {
        return NextResponse.json(
          { error: `Only ${product.stock} unit(s) left for ${product.name}.` },
          { status: 400 }
        );
      }

      const imgs = parseJsonArray<string>(product.images);
      subtotal += product.price * qty;
      validatedItems.push({
        productId: product.id,
        productName: product.name,
        productImage: imgs[0] || null,
        packSize: product.packSize,
        price: product.price,
        quantity: qty,
      });
    }

    // Coupon calculation
    let discount = 0;
    let appliedCouponCode: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.isActive && subtotal >= coupon.minOrderAmount) {
        discount =
          coupon.discountType === "PERCENT"
            ? Math.round((subtotal * coupon.discountValue) / 100)
            : coupon.discountValue;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
        if (discount > subtotal) discount = subtotal;
        appliedCouponCode = coupon.code;
      }
    }

    const settings = await getStoreSettings();
    const afterDiscount = Math.max(0, subtotal - discount);
    const shippingFee =
      afterDiscount >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
    const total = afterDiscount + shippingFee;

    const orderNumber = generateOrderNumber();

    let razorpayData: Awaited<ReturnType<typeof createRazorpayOrder>> | null = null;
    if (paymentMethod === "RAZORPAY") {
      razorpayData = await createRazorpayOrder(total, orderNumber);
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user?.id || null,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPincode,
        notes,
        subtotal,
        discount,
        couponCode: appliedCouponCode,
        shippingFee,
        total,
        paymentMethod,
        paymentStatus: "PENDING",
        razorpayOrderId: razorpayData?.id || null,
        orderStatus: "PLACED",
        items: {
          create: validatedItems,
        },
      },
      include: { items: true },
    });

    // Save address onto logged-in user for convenience
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phone: customerPhone,
          address: shippingAddress,
          city: shippingCity,
          state: shippingState,
          pincode: shippingPincode,
        },
      });
    }

    if (appliedCouponCode) {
      await prisma.coupon.update({
        where: { code: appliedCouponCode },
        data: { usageCount: { increment: 1 } },
      });
    }

    // For COD: decrement stock & send confirmation email immediately
    if (paymentMethod === "COD") {
      for (const item of validatedItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      try {
        await sendOrderConfirmationEmail(order);
      } catch (e) {
        console.error("Order email error:", e);
      }
    }

    return NextResponse.json(
      {
        order,
        razorpay: razorpayData,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ error: "Could not place order. Please try again." }, { status: 500 });
  }
}
