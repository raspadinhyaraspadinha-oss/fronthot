"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Video } from "@/data/videos";

interface VideoCardProps {
  video: Video;
  blurred?: boolean;
  onClickVideo: (video: Video) => void;
}

export default function VideoCard({
  video,
  blurred = true,
  onClickVideo,
}: VideoCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      className="group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClickVideo(video)}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      role="button"
      tabIndex={0}
      aria-label={`${video.title} por ${video.author}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClickVideo(video);
        }
      }}
    >
      {/* Thumbnail */}
      <div
        className={`relative aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] ${blurred ? "pointer-events-none" : ""}`}
        style={blurred ? { filter: "blur(8px) brightness(0.7)" } : undefined}
      >
        {/* Gradient thumbnail placeholder */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${video.gradientFrom}, ${video.gradientTo})`,
          }}
        />

        {/* Shimmer on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={hovered ? { x: "100%" } : { x: "-100%" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
            animate={hovered ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <svg className="ml-0.5 h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </motion.div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 rounded-[var(--radius-sm)] bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
          {video.duration}
        </div>

        {/* Fake progress scrubber */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <motion.div
            className="h-full bg-[var(--color-accent)]"
            initial={{ width: 0 }}
            animate={{ width: `${video.progress}%` }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          />
        </div>

        {/* Preview credit pill */}
        {blurred && (
          <div className="absolute top-2 left-2 rounded-[var(--radius-pill)] bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            Preview 1 crédito
          </div>
        )}
      </div>

      {/* Info */}
      <div className={`mt-3 ${blurred ? "opacity-60" : ""}`} style={blurred ? { filter: "blur(2px)" } : undefined}>
        <div className="flex gap-3">
          {/* Fake avatar */}
          <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)]" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
              {video.title}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
              {video.author}
            </p>
            <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
              {video.views} · {video.timestamp}
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
