import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: body.name ? String(body.name).trim() : user.name,
      phone: body.phone !== undefined ? String(body.phone).trim() || null : user.phone,
      address: body.address !== undefined ? String(body.address).trim() || null : user.address,
      city: body.city !== undefined ? String(body.city).trim() || null : user.city,
      state: body.state !== undefined ? String(body.state).trim() || null : user.state,
      pincode: body.pincode !== undefined ? String(body.pincode).trim() || null : user.pincode,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
    },
  });

  return NextResponse.json({ user: updated });
}
