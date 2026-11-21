import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin, verifyAdminPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const currentPassword = String(body.currentPassword || "").trim();
    const newPassword = String(body.newPassword || "").trim();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are both required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const isCurrentValid = await verifyAdminPassword(admin.id, currentPassword);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Current password is incorrect. Verification failed." },
        { status: 401 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    });

    // Security audit log
    await prisma.emailLog.create({
      data: {
        to: admin.email,
        subject: "Security Notice: Admin Password Changed",
        type: "SECURITY_ALERT",
        html: `<p>Admin password for account <strong>${admin.email}</strong> was successfully updated at ${new Date().toISOString()}.</p>`,
        status: "SENT",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin password has been securely updated.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Password change error", details: message }, { status: 500 });
  }
}
