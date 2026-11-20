import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const productId = String(body.productId || "");
    const rating = Math.min(5, Math.max(1, Number(body.rating || 5)));
    const title = String(body.title || "").trim();
    const comment = String(body.comment || "").trim();
    const authorName = String(body.authorName || user?.name || "").trim();

    if (!productId || !authorName || comment.length < 4) {
      return NextResponse.json(
        { error: "Please enter your name and a review comment." },
        { status: 400 }
      );
    }

    let verifiedPurchase = false;
    if (user) {
      const priorOrder = await prisma.order.findFirst({
        where: {
          userId: user.id,
          orderStatus: { not: "CANCELLED" },
          items: { some: { productId } },
        },
      });
      verifiedPurchase = Boolean(priorOrder);
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: user?.id || null,
        authorName,
        rating,
        title: title || null,
        comment,
        verifiedPurchase,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error("POST /api/reviews error:", err);
    return NextResponse.json({ error: "Could not submit review." }, { status: 500 });
  }
}
