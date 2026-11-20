import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseJsonArray } from "@/lib/format";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        reviews: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const reviewCount = product.reviews.length;
    const avgRating =
      reviewCount > 0
        ? Number((product.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount).toFixed(1))
        : 5.0;

    return NextResponse.json({
      product: {
        ...product,
        concerns: parseJsonArray<string>(product.concerns),
        images: parseJsonArray<string>(product.images),
        reviewCount,
        avgRating,
      },
    });
  } catch (err) {
    console.error("GET /api/products/[id] error:", err);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}

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

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name).trim() : existing.name,
        subtitle: body.subtitle !== undefined ? String(body.subtitle).trim() || null : existing.subtitle,
        description: body.description !== undefined ? String(body.description).trim() : existing.description,
        ingredients: body.ingredients !== undefined ? String(body.ingredients).trim() || null : existing.ingredients,
        benefits: body.benefits !== undefined ? String(body.benefits).trim() || null : existing.benefits,
        howToUse: body.howToUse !== undefined ? String(body.howToUse).trim() || null : existing.howToUse,
        price: body.price !== undefined ? Math.round(Number(body.price)) : existing.price,
        compareAtPrice:
          body.compareAtPrice !== undefined
            ? body.compareAtPrice
              ? Math.round(Number(body.compareAtPrice))
              : null
            : existing.compareAtPrice,
        packSize: body.packSize !== undefined ? String(body.packSize).trim() : existing.packSize,
        stock: body.stock !== undefined ? Math.max(0, Number(body.stock)) : existing.stock,
        categoryId: body.categoryId || existing.categoryId,
        concerns: Array.isArray(body.concerns) ? JSON.stringify(body.concerns) : existing.concerns,
        images: Array.isArray(body.images) ? JSON.stringify(body.images.filter(Boolean)) : existing.images,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : existing.isFeatured,
        isBestSeller: body.isBestSeller !== undefined ? Boolean(body.isBestSeller) : existing.isBestSeller,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      },
      include: { category: true },
    });

    return NextResponse.json({
      product: {
        ...updated,
        concerns: parseJsonArray<string>(updated.concerns),
        images: parseJsonArray<string>(updated.images),
      },
    });
  } catch (err) {
    console.error("PATCH /api/products/[id] error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/products/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
