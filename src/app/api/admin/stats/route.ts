import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { isSmtpConfigured } from "@/lib/email";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const [orders, products, customerCount, emailCount] = await Promise.all([
    prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      orderBy: { stock: "asc" },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.emailLog.count(),
  ]);

  const nonCancelled = orders.filter((o) => o.orderStatus !== "CANCELLED");
  const totalRevenue = nonCancelled.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(
    (o) => o.orderStatus === "PLACED" || o.orderStatus === "PACKED"
  ).length;
  const lowStockProducts = products.filter((p) => p.stock <= 20);

  return NextResponse.json({
    stats: {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      activeProducts: products.filter((p) => p.isActive).length,
      totalProducts: products.length,
      customerCount,
      emailCount,
    },
    lowStockProducts,
    recentOrders: orders.slice(0, 6),
    integrations: {
      razorpayLive: isRazorpayConfigured(),
      smtpLive: isSmtpConfigured(),
    },
  });
}
