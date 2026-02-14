import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/store";
import { createHash } from "crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, planName, amount, customer, utms, fbc, fbp } = body;

    if (!planId || !amount) {
      return NextResponse.json(
        { error: "Missing planId or amount" },
        { status: 400 }
      );
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // ── 1. Call Mangofy API to create Pix charge ──────────────
    const mangofyUrl = process.env.MANGOFY_API_URL;
    const mangofyAuth = process.env.MANGOFY_AUTHORIZATION;

    let pixCode = "";
    let qrImage = "";
    let paymentCode = "";

    if (mangofyUrl && mangofyAuth) {
      try {
        const mangofyRes = await fetch(`${mangofyUrl}/transaction`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mangofyAuth,
            store_code: process.env.MANGOFY_STORE_CODE_HEADER || "",
          },
          body: JSON.stringify({
            payment_method: "pix",
            amount,
            client: customer || {},
            items: [
              {
                title: `Acesso ${planName || planId}`,
                quantity: 1,
                unit_price: amount,
                tangible: false,
              },
            ],
            metadata: {
              session_id: sessionId,
              event_id: eventId,
              utms: utms || {},
            },
            postback_url: process.env.MANGOFY_POSTBACK_URL || "",
            store_code: process.env.MANGOFY_STORE_CODE_BODY || "",
          }),
        });

        const data = await mangofyRes.json();
        console.log("Mangofy response:", JSON.stringify(data).slice(0, 500));

        if (mangofyRes.ok) {
          pixCode = data.pix_code || data.pixCode || "";
          qrImage = data.qr_image || data.qrImage || data.qr_base64 || "";
          paymentCode = data.payment_code || data.paymentCode || "";
        } else {
          console.error("Mangofy error response:", data);
        }
      } catch (e) {
        console.error("Mangofy API error:", e);
      }
    }

    // ── 2. Store session ──────────────────────────────────────
    createSession({
      id: sessionId,
      planId,
      status: "pending",
      pixCode: pixCode || `PIX_SIMULADO_${sessionId}`,
      qrImage,
      amount,
      createdAt: Date.now(),
      metadata: { eventId, utms, paymentCode, planName, customer, fbc, fbp },
    });

    // ── 3. Facebook CAPI — AddToCart ──────────────────────────
    const pixelId = process.env.FACEBOOK_PIXEL_ID;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const graphUrl =
      process.env.FACEBOOK_GRAPH_API_URL || "https://graph.facebook.com/v19.0";

    if (pixelId && accessToken) {
      const hashedUserData: Record<string, unknown> = {};
      if (customer?.email) hashedUserData.em = [sha256(customer.email)];
      if (customer?.phone) hashedUserData.ph = [sha256(customer.phone)];
      if (customer?.document)
        hashedUserData.external_id = sha256(customer.document);
      if (fbc) hashedUserData.fbc = fbc;
      if (fbp) hashedUserData.fbp = fbp;

      const capiPayload = {
        data: [
          {
            event_name: "AddToCart",
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            action_source: "website",
            event_source_url: process.env.BASE_URL || "",
            user_data: hashedUserData,
            custom_data: {
              value: amount / 100,
              currency: "BRL",
              content_type: "product",
              content_ids: [sessionId],
              ...(utms || {}),
            },
          },
        ],
        ...(process.env.FACEBOOK_TEST_EVENT_CODE
          ? { test_event_code: process.env.FACEBOOK_TEST_EVENT_CODE }
          : {}),
      };

      fetch(`${graphUrl}/${pixelId}/events?access_token=${accessToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(capiPayload),
      }).catch((e) => console.error("CAPI AddToCart error:", e));
    }

    // ── 4. UTMify — waiting_payment ───────────────────────────
    const utmifyUrl = process.env.UTMIFY_API_URL;
    const utmifyToken = process.env.UTMIFY_API_TOKEN;

    if (utmifyUrl && utmifyToken) {
      const orderId = sessionId.replace("session_", "").slice(0, 16);
      const utmifyPayload = {
        orderId,
        platform: "StreamVault",
        paymentMethod: "pix",
        status: "waiting_payment",
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
        approvedDate: null,
        refundedAt: null,
        customer: {
          name: customer?.name || "",
          email: customer?.email || "",
          phone: customer?.phone || "",
          document: customer?.document || "",
          country: "BR",
          ip: "",
        },
        products: [
          {
            id: orderId,
            name: planName || planId,
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: amount,
          },
        ],
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
          totalPriceInCents: amount,
          gatewayFeeInCents: 0,
          userCommissionInCents: amount,
        },
        isTest: false,
      };

      fetch(utmifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-token": utmifyToken,
        },
        body: JSON.stringify(utmifyPayload),
      }).catch((e) => console.error("UTMify waiting_payment error:", e));
    }

    return NextResponse.json({
      sessionId,
      pixCode: pixCode || `PIX_SIMULADO_${sessionId}`,
      qrImage,
      eventId,
      status: "pending",
    });
  } catch (error) {
    console.error("create-pix error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
