import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/store";
import { createHash } from "crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, planName, amount, utms, fbc, fbp } = body;

    if (!planId || !amount) {
      return NextResponse.json(
        { error: "Missing planId or amount" },
        { status: 400 }
      );
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const externalCode = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // ── 1. Call Mangofy API to create Pix charge ──────────────
    const mangofyUrl = process.env.MANGOFY_API_URL;
    const mangofyAuth = process.env.MANGOFY_AUTHORIZATION;
    const storeCodeHeader = process.env.MANGOFY_STORE_CODE_HEADER;
    const storeCodeBody = process.env.MANGOFY_STORE_CODE_BODY;

    // Default customer (required by Mangofy)
    const defaultCustomer = {
      email: process.env.DEFAULT_CLIENT_EMAIL || "cidinha_lira10@hotmail.com",
      name: process.env.DEFAULT_CLIENT_NAME || "MARIA APARECIDA NUNES DE LIRA",
      document: process.env.DEFAULT_CLIENT_DOCUMENT || "88017427468",
      phone: process.env.DEFAULT_CLIENT_PHONE || "11973003483",
    };

    let pixCode = "";
    let qrImage = "";
    let paymentCode = "";

    if (!mangofyUrl || !mangofyAuth || !storeCodeHeader || !storeCodeBody) {
      console.error("Mangofy env vars not configured!");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                 req.headers.get("x-real-ip") ||
                 "127.0.0.1";

      const payload = {
        store_code: storeCodeBody,
        external_code: externalCode,
        payment_method: "pix",
        payment_amount: amount,
        pix: {
          expires_in_days: 1,
        },
        payment_format: "regular",
        installments: 1,
        postback_url: process.env.MANGOFY_POSTBACK_URL || "",
        items: [
          {
            code: `ITEM-${externalCode}`,
            amount: 1,
            price: amount,
          },
        ],
        customer: {
          email: defaultCustomer.email,
          name: defaultCustomer.name,
          document: defaultCustomer.document,
          phone: defaultCustomer.phone,
          ip,
        },
        metadata: {
          session_id: sessionId,
          event_id: eventId,
          plan_id: planId,
          plan_name: planName,
          ...(utms || {}),
        },
      };

      console.log("[MANGOFY] Creating Pix payment:", { externalCode, amount });

      const mangofyRes = await fetch(`${mangofyUrl}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Store-Code": storeCodeHeader,
          "Authorization": mangofyAuth,
        },
        body: JSON.stringify(payload),
      });

      const data = await mangofyRes.json();
      console.log("[MANGOFY] Response status:", mangofyRes.status);
      console.log("[MANGOFY] Response data:", JSON.stringify(data).slice(0, 800));

      if (mangofyRes.ok && data.payment_code) {
        paymentCode = data.payment_code;
        // Mangofy retorna o PIX dentro de data.pix
        if (data.pix) {
          pixCode = data.pix.qr_code || data.pix.qrcode || "";
          qrImage = data.pix.qr_code_base64 || data.pix.qrcode_base64 || "";
        }
      } else {
        console.error("[MANGOFY] Error response:", data);
        return NextResponse.json(
          { error: "Failed to create Pix payment", details: data },
          { status: mangofyRes.status }
        );
      }
    } catch (e) {
      console.error("[MANGOFY] API error:", e);
      return NextResponse.json(
        { error: "Payment gateway error" },
        { status: 500 }
      );
    }

    // ── 2. Store session ──────────────────────────────────────
    createSession({
      id: sessionId,
      planId,
      status: "pending",
      pixCode,
      qrImage,
      amount,
      createdAt: Date.now(),
      metadata: { eventId, utms, paymentCode, externalCode, planName, fbc, fbp },
    });

    // ── 3. Facebook CAPI — AddToCart ──────────────────────────
    const pixelId = process.env.FACEBOOK_PIXEL_ID;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const graphUrl =
      process.env.FACEBOOK_GRAPH_API_URL || "https://graph.facebook.com/v19.0";

    if (pixelId && accessToken) {
      const hashedUserData: Record<string, unknown> = {};
      hashedUserData.em = [sha256(defaultCustomer.email)];
      hashedUserData.ph = [sha256(defaultCustomer.phone)];
      hashedUserData.external_id = sha256(defaultCustomer.document);
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
      const orderId = paymentCode || externalCode;
      const utmifyPayload = {
        orderId,
        platform: "StreamVault",
        paymentMethod: "pix",
        status: "waiting_payment",
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
        approvedDate: null,
        refundedAt: null,
        customer: {
          name: defaultCustomer.name,
          email: defaultCustomer.email,
          phone: defaultCustomer.phone,
          document: defaultCustomer.document,
          country: "BR",
          ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
        },
        products: [
          {
            id: paymentCode || externalCode,
            name: planName || planId,
            planId: planId,
            planName: planName || null,
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
      pixCode,
      qrImage,
      paymentCode,
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
