import { NextRequest, NextResponse } from "next/server";
import { trackEvent, getMetrics } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const { event, data } = await req.json();

    if (!event) {
      return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    trackEvent(event, data);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ANALYTICS] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const metrics = getMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[ANALYTICS] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
