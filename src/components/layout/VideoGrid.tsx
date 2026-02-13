"use client";

import { videos, type Video } from "@/data/videos";
import VideoCard from "@/components/ui/VideoCard";

interface VideoGridProps {
  blurred?: boolean;
  onClickVideo: (video: Video) => void;
}

export default function VideoGrid({
  blurred = true,
  onClickVideo,
}: VideoGridProps) {
  return (
    <section className="pt-14 lg:pl-56">
      <div className="p-4 sm:p-6">
        {/* Category pills skeleton */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {["Todos", "Populares", "Recentes", "Música", "Fitness", "Viagem", "Tech"].map(
            (cat) => (
              <span
                key={cat}
                className={`shrink-0 rounded-[var(--radius-pill)] px-4 py-1.5 text-sm font-medium transition-colors ${
                  cat === "Todos"
                    ? "bg-[var(--color-text)] dark:bg-[var(--color-text-dark)] text-[var(--color-surface)] dark:text-[var(--color-surface-dark)]"
                    : "bg-[var(--color-surface2)] dark:bg-[var(--color-surface2-dark)] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]"
                } ${blurred ? "pointer-events-none" : "cursor-pointer hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-border-dark)]"}`}
                style={blurred ? { filter: "blur(3px)" } : undefined}
              >
                {cat}
              </span>
            )
          )}
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video: Video) => (
            <VideoCard
              key={video.id}
              video={video}
              blurred={blurred}
              onClickVideo={onClickVideo}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
