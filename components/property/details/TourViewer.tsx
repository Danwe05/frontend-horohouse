"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import apiClient from "@/lib/api";

type TourType = "kuula" | "youtube" | "images" | "none";

interface TourViewerProps {
  tourType: TourType;
  virtualTourUrl?: string;   // Kuula share URL  OR  YouTube video ID
  images?: Array<{ url: string; caption?: string }>;
  propertyId: string;
  onClose: () => void;
}

export default function TourViewer({
  tourType,
  virtualTourUrl,
  images = [],
  propertyId,
  onClose,
}: TourViewerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [iframeReady, setIframeReady] = useState(false);

  // Fire-and-forget analytics — never blocks UX on slow connections
  useEffect(() => {
  apiClient.trackTourView(propertyId); // already silent-fails internally
}, [propertyId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrentIdx((p) => Math.min(p + 1, images.length - 1));
      if (e.key === "ArrowLeft") setCurrentIdx((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, images.length]);

  const prev = useCallback(() => setCurrentIdx((p) => Math.max(p - 1, 0)), []);
  const next = useCallback(
    () => setCurrentIdx((p) => Math.min(p + 1, images.length - 1)),
    [images.length]
  );

  // Derive the embed src outside JSX for clarity
  const kuulaSrc = virtualTourUrl;
  const youtubeSrc = virtualTourUrl
    ? `https://www.youtube-nocookie.com/embed/${virtualTourUrl}?autoplay=1&rel=0&modestbranding=1`
    : undefined;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Virtual tour"
    >
      {/* Close button — large tap target for mobile */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
        aria-label="Close tour"
      >
        <X className="h-5 w-5" />
      </button>

      {/* ── 360° Kuula embed ── */}
      {tourType === "kuula" && kuulaSrc && (
        <div className="flex-1 relative">
          {!iframeReady && (
            <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
              Loading 360° tour…
            </div>
          )}
          <iframe
            src={kuulaSrc}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            onLoad={() => setIframeReady(true)}
            style={{ opacity: iframeReady ? 1 : 0, transition: "opacity 0.3s" }}
            title="360° virtual tour"
          />
        </div>
      )}

      {/* ── YouTube video walkthrough ── */}
      {tourType === "youtube" && youtubeSrc && (
        <div className="flex-1">
          <iframe
            src={youtubeSrc}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            allow="autoplay; encrypted-media"
            title="Property video walkthrough"
          />
        </div>
      )}

      {/* ── Image-based "fake tour" ── */}
      {tourType === "images" && images.length > 0 && (
        <div className="flex-1 flex flex-col">
          {/* Main image */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <img
              key={currentIdx}         // remount = browser cancels previous decode
              src={images[currentIdx].url}
              alt={images[currentIdx].caption ?? `Room ${currentIdx + 1}`}
              className="max-w-full max-h-full object-contain"
              loading="eager"
            />

            {/* Prev / Next — only show when there's more than 1 image */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  disabled={currentIdx === 0}
                  className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white disabled:opacity-30 transition-colors"
                  aria-label="Previous room"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={next}
                  disabled={currentIdx === images.length - 1}
                  className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white disabled:opacity-30 transition-colors"
                  aria-label="Next room"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom nav bar */}
          <div className="flex-none bg-black/80 px-4 py-3 flex items-center justify-between gap-4">
            {/* Caption */}
            <p className="text-white/70 text-sm truncate flex-1">
              {images[currentIdx].caption ?? ""}
            </p>

            {/* Dot indicators — max 8 to keep mobile legible */}
            {images.length <= 8 && (
              <div className="flex gap-1.5 shrink-0">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentIdx ? "bg-white scale-125" : "bg-white/40"
                    }`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Counter */}
            <span className="text-white/70 text-sm shrink-0">
              {currentIdx + 1} / {images.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}