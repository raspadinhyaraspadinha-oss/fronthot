import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply antibot to API routes that create payments
  if (pathname === "/api/create-pix") {
    // Check for simple bot protection token (set by client-side JS)
    const botToken = request.headers.get("x-bot-check");
    const userAgent = request.headers.get("user-agent") || "";

    // Very basic checks (real users from FB ads will pass these)
    const hasValidToken = botToken && botToken.length > 20;
    const hasUserAgent = userAgent.length > 20;
    const isLikelyBot =
      !hasValidToken ||
      !hasUserAgent ||
      userAgent.includes("bot") ||
      userAgent.includes("crawl") ||
      userAgent.includes("spider");

    if (isLikelyBot) {
      console.log("[ANTIBOT] Blocked request:", {
        userAgent: userAgent.slice(0, 50),
        hasToken: !!botToken,
      });
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/create-pix"],
};
