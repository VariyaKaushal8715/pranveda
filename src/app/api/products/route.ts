import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseJsonArray, slugify } from "@/lib/format";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const category = searchParams.get("category")?.trim() || "";
    const concern = searchParams.get("concern")?.trim() || "";
    const sort = searchParams.get("sort") || "featured";
    const featured = searchParams.get("featured");
    const bestseller = searchParams.get("bestseller");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: Record<string, unknown> = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (category) {
      where.category = { slug: category };
    }
    if (featured === "true") {
      where.isFeatured = true;
    }
    if (bestseller === "true") {
      where.isBestSeller = true;
    }

    const rawProducts = await prisma.product.findMany({
      where,
      include: {
        category: true,
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }],
    });

    let formatted = rawProducts.map((p) => {
      const reviewCount = p.reviews.length;
      const avgRating =
        reviewCount > 0
          ? Number((p.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
          : 5.0;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        subtitle: p.subtitle,
        description: p.description,
        ingredients: p.ingredients,
        benefits: p.benefits,
        howToUse: p.howToUse,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        packSize: p.packSize,
        stock: p.stock,
        categoryId: p.categoryId,
        category: p.category,
        concerns: parseJsonArray<string>(p.concerns),
        images: parseJsonArray<string>(p.images),
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        isActive: p.isActive,
        reviewCount,
        avgRating,
        createdAt: p.createdAt,
      };
    });

    if (search) {
      formatted = formatted.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          (p.subtitle || "").toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.concerns.some((c) => c.toLowerCase().includes(search)) ||
          p.category.name.toLowerCase().includes(search)
      );
    }

    if (concern) {
      formatted = formatted.filter((p) =>
        p.concerns.some((c) => c.toLowerCase() === concern.toLowerCase())
      );
    }

    if (sort === "price-asc") {
      formatted.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      formatted.sort((a, b) => b.price - a.price);
    } else if (sort === "rating") {
      formatted.sort((a, b) => b.avgRating - a.avgRating);
    }

    return NextResponse.json({ products: formatted });
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const price = Number(body.price);

    if (!name || Number.isNaN(price) || price <= 0) {
      return NextResponse.json({ error: "Valid product name and price are required." }, { status: 400 });
    }

    let slug = body.slug ? slugify(String(body.slug)) : slugify(name);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    let categoryId = String(body.categoryId || "");
    if (!categoryId) {
      const firstCat = await prisma.category.findFirst();
      if (!firstCat) {
        return NextResponse.json({ error: "No category found." }, { status: 400 });
      }
      categoryId = firstCat.id;
    }

    const concernsArr = Array.isArray(body.concerns) ? body.concerns : [];
    const imagesArr = Array.isArray(body.images) ? body.images.filter(Boolean) : [];

    const created = await prisma.product.create({
      data: {
        name,
        slug,
        subtitle: body.subtitle ? String(body.subtitle).trim() : null,
        description: String(body.description || "Authentic PranVeda Ayurvedic formulation.").trim(),
        ingredients: body.ingredients ? String(body.ingredients).trim() : null,
        benefits: body.benefits ? String(body.benefits).trim() : null,
        howToUse: body.howToUse ? String(body.howToUse).trim() : null,
        price: Math.round(price),
        compareAtPrice: body.compareAtPrice ? Math.round(Number(body.compareAtPrice)) : null,
        packSize: String(body.packSize || "100g").trim(),
        stock: Math.max(0, Number(body.stock ?? 50)),
        categoryId,
        concerns: JSON.stringify(concernsArr),
        images: JSON.stringify(imagesArr.length > 0 ? imagesArr : ["/images/ashwagandha.jpg"]),
        isFeatured: Boolean(body.isFeatured),
        isBestSeller: Boolean(body.isBestSeller),
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
      include: { category: true },
    });

    return NextResponse.json(
      {
        product: {
          ...created,
          concerns: parseJsonArray<string>(created.concerns),
          images: parseJsonArray<string>(created.images),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/products error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
