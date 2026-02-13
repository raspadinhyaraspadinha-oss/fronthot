import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, planName, amount, customer, utms } = body;

    if (!planId || !amount) {
      return NextResponse.json({ error: "Missing planId or amount" }, { status: 400 });
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // In production: call Mangofy API to create Pix charge
    const mangofyUrl = process.env.MANGOFY_API_URL;
    const mangofyAuth = process.env.MANGOFY_AUTHORIZATION;

    let pixCode = "";
    let qrImage = "";

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

        if (mangofyRes.ok) {
          const data = await mangofyRes.json();
          pixCode = data.pix_code || "";
          qrImage = data.qr_image || "";
        }
      } catch (e) {
        console.error("Mangofy API error:", e);
      }
    }

    // Store session
    createSession({
      id: sessionId,
      planId,
      status: "pending",
      pixCode: pixCode || `PIX_SIMULADO_${sessionId}`,
      qrImage,
      amount,
      createdAt: Date.now(),
      metadata: { eventId, utms },
    });

    // In production: send CAPI AddToCart event and UTMify waiting_payment
    // (omitted here for brevity — implement server-side HTTP calls)

    return NextResponse.json({
      sessionId,
      pixCode: pixCode || `PIX_SIMULADO_${sessionId}`,
      qrImage,
      eventId,
      status: "pending",
    });
  } catch (error) {
    console.error("create-pix error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
