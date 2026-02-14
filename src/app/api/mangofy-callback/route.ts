import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/store";
import { createHash } from "crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Mangofy callback received:", JSON.stringify(body).slice(0, 500));

    const { payment_code, external_code, payment_status, metadata } = body;

    const sessionId = metadata?.session_id || external_code || payment_code;

    if (!sessionId) {
      console.error("No session identifier found in callback");
      return NextResponse.json({ error: "Missing session identifier" }, { status: 400 });
    }

    if (payment_status === "approved") {
      const session = updateSession(sessionId, {
        status: "paid",
        paidAt: Date.now(),
      });

      if (!session) {
        console.error(`Session not found: ${sessionId}`);
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      console.log(`✅ Payment confirmed for session ${sessionId}`);

      const meta = session.metadata as Record<string, unknown> | undefined;
      const utms = (meta?.utms as Record<string, string>) || {};
      const customer = (meta?.customer as Record<string, string>) || {};
      const eventId = (meta?.eventId as string) || `evt_purchase_${Date.now()}`;
      const fbc = (meta?.fbc as string) || null;
      const fbp = (meta?.fbp as string) || null;
      const planName = (meta?.planName as string) || session.planId;

      // ── 1. Facebook CAPI — Purchase ─────────────────────────
      const pixelId = process.env.FACEBOOK_PIXEL_ID;
      const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
      const graphUrl = process.env.FACEBOOK_GRAPH_API_URL || "https://graph.facebook.com/v19.0";

      if (pixelId && accessToken) {
        const hashedUserData: Record<string, unknown> = {};
        if (customer?.email) hashedUserData.em = [sha256(customer.email)];
        if (customer?.phone) hashedUserData.ph = [sha256(customer.phone)];
        if (customer?.document) hashedUserData.external_id = sha256(customer.document);
        if (fbc) hashedUserData.fbc = fbc;
        if (fbp) hashedUserData.fbp = fbp;

        const capiPayload = {
          data: [{
            event_name: "Purchase",
            event_time: Math.floor(Date.now() / 1000),
            event_id: `purchase_${eventId}`,
            action_source: "website",
            event_source_url: process.env.BASE_URL || "",
            user_data: hashedUserData,
            custom_data: {
              value: session.amount / 100,
              currency: "BRL",
              content_type: "product",
              content_ids: [sessionId],
              ...utms,
            },
          }],
          ...(process.env.FACEBOOK_TEST_EVENT_CODE
            ? { test_event_code: process.env.FACEBOOK_TEST_EVENT_CODE }
            : {}),
        };

        try {
          const res = await fetch(`${graphUrl}/${pixelId}/events?access_token=${accessToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(capiPayload),
          });
          const result = await res.json();
          console.log("CAPI Purchase result:", JSON.stringify(result));
        } catch (e) {
          console.error("CAPI Purchase error:", e);
        }
      }

      // ── 2. UTMify — paid ────────────────────────────────────
      const utmifyUrl = process.env.UTMIFY_API_URL;
      const utmifyToken = process.env.UTMIFY_API_TOKEN;

      if (utmifyUrl && utmifyToken) {
        const orderId = sessionId.replace("session_", "").slice(0, 16);
        const utmifyPayload = {
          orderId,
          platform: "StreamVault",
          paymentMethod: "pix",
          status: "paid",
          createdAt: new Date(session.createdAt).toISOString().replace("T", " ").slice(0, 19),
          approvedDate: new Date().toISOString().replace("T", " ").slice(0, 19),
          refundedAt: null,
          customer: {
            name: customer?.name || "",
            email: customer?.email || "",
            phone: customer?.phone || "",
            document: customer?.document || "",
            country: "BR",
            ip: "",
          },
          products: [{
            id: orderId,
            name: planName,
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: session.amount,
          }],
          trackingParameters: {
            src: null,
            sck: null,
            utm_source: utms?.utm_source || null,
            utm_campaign: utms?.utm_campaign || null,
            utm_medium: utms?.utm_medium || null,
            utm_content: utms?.utm_content || null,
            utm_term: utms?.utm_term || null,
            fbclid: utms?.fbclid || null,
            fbp: fbp || null,
          },
          commission: {
            totalPriceInCents: session.amount,
            gatewayFeeInCents: 0,
            userCommissionInCents: session.amount,
          },
          isTest: false,
        };

        try {
          await fetch(utmifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-token": utmifyToken },
            body: JSON.stringify(utmifyPayload),
          });
          console.log("UTMify paid sent for order:", orderId);
        } catch (e) {
          console.error("UTMify paid error:", e);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mangofy-callback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
