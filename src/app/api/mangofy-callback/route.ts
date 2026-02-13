import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payment_code, external_code, payment_status, metadata } = body;

    const sessionId = metadata?.session_id || external_code || payment_code;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session identifier" }, { status: 400 });
    }

    if (payment_status === "approved") {
      const session = updateSession(sessionId, {
        status: "paid",
        paidAt: Date.now(),
      });

      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      // In production:
      // 1. Send CAPI Purchase event to Facebook
      // 2. Send UTMify with status "paid"
      // 3. Generate access key and store it

      console.log(`Payment confirmed for session ${sessionId}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mangofy-callback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
