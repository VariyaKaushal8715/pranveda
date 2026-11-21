import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, verifyAdminPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const password = String(body.password || "").trim();

    if (!password) {
      return NextResponse.json({ error: "Password is required for verification." }, { status: 400 });
    }

    const isValid = await verifyAdminPassword(admin.id, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect admin password. Security verification failed." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Admin password successfully verified.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Verification error", details: message }, { status: 500 });
  }
}
