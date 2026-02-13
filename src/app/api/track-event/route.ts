import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, eventId, eventSourceUrl, userData, customData } = body;

    const pixelId = process.env.FACEBOOK_PIXEL_ID;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const graphUrl = process.env.FACEBOOK_GRAPH_API_URL || "https://graph.facebook.com/v19.0";

    if (!pixelId || !accessToken) {
      // Return success silently when CAPI is not configured
      return NextResponse.json({ ok: true, capi: false });
    }

    const hashedUserData: Record<string, unknown> = {};
    if (userData?.email) hashedUserData.em = [sha256(userData.email)];
    if (userData?.phone) hashedUserData.ph = [sha256(userData.phone)];
    if (userData?.document) hashedUserData.external_id = sha256(userData.document);
    if (userData?.fbc) hashedUserData.fbc = userData.fbc;
    if (userData?.fbp) hashedUserData.fbp = userData.fbp;

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          event_source_url: eventSourceUrl || process.env.BASE_URL,
          user_data: hashedUserData,
          custom_data: customData || {},
        },
      ],
      ...(process.env.FACEBOOK_TEST_EVENT_CODE
        ? { test_event_code: process.env.FACEBOOK_TEST_EVENT_CODE }
        : {}),
    };

    const response = await fetch(
      `${graphUrl}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    return NextResponse.json({ ok: response.ok, result });
  } catch (error) {
    console.error("track-event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
