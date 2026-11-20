import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { isSmtpConfigured, sendWelcomeEmail } from "@/lib/email";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const emails = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    emails,
    smtpConfigured: isSmtpConfigured(),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const to = String(body.to || admin.email).trim();
  const result = await sendWelcomeEmail({
    name: body.name || "Test Customer",
    email: to,
  });

  return NextResponse.json({ result });
}
