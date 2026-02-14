"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import VideoGrid from "@/components/layout/VideoGrid";
import MainOverlay from "@/components/overlay/MainOverlay";
import AgeGate from "@/components/ui/AgeGate";
import SocialProofModal from "@/components/ui/SocialProofModal";
import ToastContainer, { showToast } from "@/components/ui/Toast";
import { captureUTMs, getFBP, buildFBC } from "@/lib/utm";
import { initFacebookPixel, trackPixelEvent, generateEventId } from "@/lib/pixel";
import { trackClientEvent } from "@/lib/analytics";
import type { Video } from "@/data/videos";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [, setCreditsVersion] = useState(0);

  // Conversion funnel gates
  const [ageGatePassed, setAgeGatePassed] = useState(false);
  const [socialProofSeen, setSocialProofSeen] = useState(false);

  // Initialize UTMs, Pixel, and track PageView
  useEffect(() => {
    const utms = captureUTMs();
    trackClientEvent("page_view", { utms });

    const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
    if (pixelId) {
      initFacebookPixel(pixelId);
      const eventId = generateEventId();
      trackPixelEvent("PageView", {}, eventId);

      // Build fbc/fbp for CAPI user matching
      const fbp = getFBP();
      const fbc = buildFBC(utms.fbclid);

      // Server-side CAPI PageView with UTMs + fbc + fbp
      fetch("/api/track-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "PageView",
          eventId,
          eventSourceUrl: window.location.href,
          userData: {
            ...(fbc ? { fbc } : {}),
            ...(fbp ? { fbp } : {}),
          },
          customData: {
            ...utms,
          },
        }),
      }).catch(() => {});
    }
  }, []);

  const handleAgeGateConfirm = useCallback(() => {
    setAgeGatePassed(true);
    trackClientEvent("age_gate_passed");
  }, []);

  const handleSocialProofContinue = useCallback(() => {
    setSocialProofSeen(true);
    setOverlayOpen(true);
    trackClientEvent("social_proof_seen");
    trackClientEvent("overlay_opened");
  }, []);

  const handleCreditsChanged = useCallback(() => {
    setCreditsVersion((v) => v + 1);
  }, []);

  // Clicking a blurred video card reopens the main overlay
  const handleClickVideo = useCallback((_video: Video) => {
    setOverlayOpen(true);
    trackClientEvent("video_card_clicked");
    showToast("Escolha um plano ou use um crédito para assistir.", "info");
  }, []);

  return (
    <>
      {/* Age gate — first barrier */}
      {!ageGatePassed && <AgeGate onConfirm={handleAgeGateConfirm} />}

      {/* Social proof — second barrier */}
      {ageGatePassed && !socialProofSeen && (
        <SocialProofModal onContinue={handleSocialProofContinue} />
      )}

      <Header onToggleSidebar={() => setSidebarOpen((o) => !o)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <VideoGrid blurred onClickVideo={handleClickVideo} />

      {/* Main overlay — opens after social proof */}
      <MainOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        onCreditsChanged={handleCreditsChanged}
      />

      <ToastContainer />
    </>
  );
}
