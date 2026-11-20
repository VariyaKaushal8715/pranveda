import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json();

  const updated = await prisma.coupon.update({
    where: { id },
    data: {
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      discountValue: body.discountValue !== undefined ? Math.round(Number(body.discountValue)) : undefined,
      minOrderAmount: body.minOrderAmount !== undefined ? Math.round(Number(body.minOrderAmount)) : undefined,
    },
  });

  return NextResponse.json({ coupon: updated });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await context.params;
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
