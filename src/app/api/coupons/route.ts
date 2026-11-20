import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const validateCode = searchParams.get("validate")?.trim().toUpperCase();
  const subtotal = Number(searchParams.get("subtotal") || 0);

  if (validateCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: validateCode },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 404 });
    }

    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Minimum order of ₹${coupon.minOrderAmount} required for ${coupon.code}.`,
        },
        { status: 400 }
      );
    }

    let discount =
      coupon.discountType === "PERCENT"
        ? Math.round((subtotal * coupon.discountValue) / 100)
        : coupon.discountValue;

    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
    if (discount > subtotal) {
      discount = subtotal;
    }

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount,
      },
    });
  }

  // Otherwise Admin lists all coupons
  const admin = await requireAdmin();
  if (!admin) {
    const activeCoupons = await prisma.coupon.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ coupons: activeCoupons });
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    const discountType = body.discountType === "FLAT" ? "FLAT" : "PERCENT";
    const discountValue = Number(body.discountValue || 0);

    if (!code || discountValue <= 0) {
      return NextResponse.json({ error: "Valid coupon code and discount value required." }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue: Math.round(discountValue),
        minOrderAmount: Math.max(0, Math.round(Number(body.minOrderAmount || 0))),
        maxDiscount: body.maxDiscount ? Math.round(Number(body.maxDiscount)) : null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err) {
    console.error("POST /api/coupons error:", err);
    return NextResponse.json({ error: "Coupon code may already exist." }, { status: 400 });
  }
}
