import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/settings";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { isSmtpConfigured } from "@/lib/email";

export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json({
    settings,
    integrations: {
      razorpayLive: isRazorpayConfigured(),
      smtpLive: isSmtpConfigured(),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const current = await getStoreSettings();

  const updated = await prisma.storeSetting.update({
    where: { id: "default" },
    data: {
      storeName: body.storeName !== undefined ? String(body.storeName).trim() : current.storeName,
      tagline: body.tagline !== undefined ? String(body.tagline).trim() : current.tagline,
      whatsappNumber:
        body.whatsappNumber !== undefined
          ? String(body.whatsappNumber).replace(/[^0-9]/g, "")
          : current.whatsappNumber,
      supportEmail:
        body.supportEmail !== undefined ? String(body.supportEmail).trim() : current.supportEmail,
      address: body.address !== undefined ? String(body.address).trim() : current.address,
      instagramUrl:
        body.instagramUrl !== undefined ? String(body.instagramUrl).trim() : current.instagramUrl,
      freeShippingThreshold:
        body.freeShippingThreshold !== undefined
          ? Math.max(0, Math.round(Number(body.freeShippingThreshold)))
          : current.freeShippingThreshold,
      shippingFee:
        body.shippingFee !== undefined
          ? Math.max(0, Math.round(Number(body.shippingFee)))
          : current.shippingFee,
    },
  });

  return NextResponse.json({ settings: updated });
}
