"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import VideoGrid from "@/components/layout/VideoGrid";
import MainOverlay from "@/components/overlay/MainOverlay";
import ToastContainer, { showToast } from "@/components/ui/Toast";
import { captureUTMs } from "@/lib/utm";
import { initFacebookPixel, trackPixelEvent, generateEventId } from "@/lib/pixel";
import type { Video } from "@/data/videos";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(true);
  const [, setCreditsVersion] = useState(0);

  // Initialize UTMs, Pixel, and track PageView
  useEffect(() => {
    captureUTMs();

    const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
    if (pixelId) {
      initFacebookPixel(pixelId);
      const eventId = generateEventId();
      trackPixelEvent("PageView", {}, eventId);

      // Also send server-side CAPI PageView
      fetch("/api/track-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "PageView",
          eventId,
          eventSourceUrl: window.location.href,
        }),
      }).catch(() => {});
    }
  }, []);

  const handleCreditsChanged = useCallback(() => {
    setCreditsVersion((v) => v + 1);
  }, []);

  // Clicking a blurred video card reopens the main overlay
  const handleClickVideo = useCallback((_video: Video) => {
    setOverlayOpen(true);
    showToast("Escolha um plano ou use um crédito para assistir.", "info");
  }, []);

  return (
    <>
      <Header onToggleSidebar={() => setSidebarOpen((o) => !o)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <VideoGrid blurred onClickVideo={handleClickVideo} />

      {/* Main overlay — opens on load, contains plans + preview player */}
      <MainOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        onCreditsChanged={handleCreditsChanged}
      />

      <ToastContainer />
    </>
  );
}
