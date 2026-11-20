import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonArray } from "@/lib/format";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ items: [], productIds: [] });
  }

  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          category: true,
          reviews: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const items = wishlist.map((w) => {
    const p = w.product;
    const reviewCount = p.reviews.length;
    const avgRating =
      reviewCount > 0
        ? Number((p.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount).toFixed(1))
        : 5.0;
    return {
      ...p,
      concerns: parseJsonArray<string>(p.concerns),
      images: parseJsonArray<string>(p.images),
      reviewCount,
      avgRating,
    };
  });

  return NextResponse.json({
    items,
    productIds: items.map((i) => i.id),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to save items to your wishlist." },
      { status: 401 }
    );
  }

  const body = await req.json();
  const productId = String(body.productId || "");
  if (!productId) {
    return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ wishlisted: false });
  } else {
    await prisma.wishlistItem.create({
      data: { userId: user.id, productId },
    });
    return NextResponse.json({ wishlisted: true });
  }
}
