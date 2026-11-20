import { NextRequest, NextResponse } from "next/server";
import { getVaidyaAdvice } from "@/lib/vaidya-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message || "").trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json(
        { error: "Please enter your message or question." },
        { status: 400 }
      );
    }

    const advice = await getVaidyaAdvice(message, history);
    return NextResponse.json(advice);
  } catch (err) {
    console.error("POST /api/ai-vaidya error:", err);
    return NextResponse.json(
      { error: "Our Ayurvedic Vaidya service is momentarily busy. Please try again." },
      { status: 500 }
    );
  }
}
