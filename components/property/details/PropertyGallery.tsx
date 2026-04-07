"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Grid, Play, Share, Heart } from "lucide-react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const TourViewer = dynamic(() => import("./TourViewer"), {
  ssr: false,
  loading: () => null,
});

interface PropertyGalleryProps {
  property: {
    images: Array<{ url: string; publicId: string; caption?: string; isMain?: boolean }>;
    title: string;
    _id: string;
    tourType?: string;
    virtualTourUrl?: string;
    videoUrl?: string;
    tourThumbnail?: string;
  };
}

const PropertyGallery = ({ property }: PropertyGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const pd = t.propertyDetails;

  const images = property.images?.length > 0
    ? [...property.images].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
    : [
        { url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80", publicId: "fallback", caption: "Property" },
      ];

  const imageUrls = images.map((img) => img.url);

  const effectiveTourType = (() => {
    const tour = property.tourType;
    if (tour && tour !== "none") return tour;
    if (property.videoUrl) return "youtube";
    return "none";
  })();

  const hasTour = effectiveTourType !== "none";

  const openLightbox = useCallback((index: number) => {
    setActiveImage(index);
    setImgLoaded(false);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const nextImage = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    setImgLoaded(false);
    setActiveImage((prev) => (prev + 1) % imageUrls.length);
  }, [imageUrls.length]);

  const previousImage = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    setImgLoaded(false);
    setActiveImage((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  }, [imageUrls.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") previousImage();
      if (e.key === "Escape") closeLightbox();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, nextImage, previousImage, closeLightbox]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!lightboxOpen || !thumbsRef.current) return;
    const activeThumb = thumbsRef.current.children[activeImage] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }, [activeImage, lightboxOpen]);

  // Touch swipe support
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (Math.abs(distance) >= minSwipeDistance) {
      distance > 0 ? nextImage() : previousImage();
    }
  };

  // How many grid cells to render on desktop
  const gridImages = imageUrls.slice(0, 5);
  const remainingCount = imageUrls.length - 5;

  return (
    <>
      {/* ─────────────────────────────────────────
          DESKTOP GRID  (md and up)
          Main 2×2 left + 2×2 right = 4-col grid
      ───────────────────────────────────────── */}
      <div className="hidden md:block relative">
        <div
          className={cn(
            "grid gap-2 rounded-xl overflow-hidden",
            gridImages.length === 1
              ? "grid-cols-1 h-[480px]"
              : gridImages.length === 2
              ? "grid-cols-2 h-[480px]"
              : gridImages.length === 3
              ? "grid-cols-[2fr_1fr] grid-rows-2 h-[480px]"
              : gridImages.length === 4
              ? "grid-cols-[2fr_1fr] grid-rows-2 h-[480px]"
              : "grid-cols-[2fr_1fr_1fr] grid-rows-2 h-[480px]"
          )}
        >
          {/* ── Main hero image ── */}
          <div
            className={cn(
              "relative cursor-pointer group overflow-hidden bg-neutral-100",
              gridImages.length >= 3 ? "row-span-2" : gridImages.length === 2 ? "" : "col-span-1"
            )}
            onClick={() => openLightbox(0)}
          >
            <img
              src={imageUrls[0]}
              alt={images[0].caption || property.title}
              className="w-full h-full object-cover transition-[filter] duration-200 group-hover:brightness-[0.88]"
            />
          </div>

          {/* ── Right-side images ── */}
          {gridImages.slice(1).map((url, idx) => {
            const globalIdx = idx + 1;
            const isLast = globalIdx === gridImages.length - 1 && remainingCount > 0;
            return (
              <div
                key={globalIdx}
                className="relative cursor-pointer group overflow-hidden bg-neutral-100"
                onClick={() => openLightbox(globalIdx)}
              >
                <img
                  src={url}
                  alt={images[globalIdx]?.caption || `${property.title} — photo ${globalIdx + 1}`}
                  className="w-full h-full object-cover transition-[filter] duration-200 group-hover:brightness-[0.88]"
                />
                {/* "Show more" overlay on the last visible cell */}
                {isLast && (
                  <div
                    className="absolute inset-0 bg-black/30 flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                  >
                    <span className="text-white text-[15px] font-semibold underline underline-offset-2">
                      +{remainingCount} more
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Floating action buttons (bottom-right) ── */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
          {hasTour && (
            <button
              onClick={() => setTourOpen(true)}
              className="
                flex items-center gap-1.5
                bg-white border border-[#222222] text-[#222222]
                text-[13px] font-semibold leading-none
                px-[14px] py-[9px] rounded-lg
                hover:bg-[#F7F7F7] active:scale-[0.98]
                transition-all duration-150 shadow-sm
              "
            >
              <Play className="w-[13px] h-[13px] fill-[#222222] stroke-0 flex-shrink-0" />
              {effectiveTourType === "kuula" ? "360° tour" : "Video tour"}
            </button>
          )}

          <button
            onClick={() => openLightbox(0)}
            className="
              flex items-center gap-1.5
              bg-white border border-[#222222] text-[#222222]
              text-[13px] font-semibold leading-none
              px-[14px] py-[9px] rounded-lg
              hover:bg-[#F7F7F7] active:scale-[0.98]
              transition-all duration-150 shadow-sm
            "
          >
            <Grid className="w-[13px] h-[13px] stroke-[2.4] flex-shrink-0" />
            {pd?.viewGallery || "Show all photos"}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          MOBILE  (below md)
          Full-width swipeable single image
          with dot indicator + photo count badge
      ───────────────────────────────────────── */}
      <div className="md:hidden relative">
        {/* Swipeable image strip */}
        <div
          className="relative h-[280px] sm:h-[340px] overflow-hidden rounded-xl bg-neutral-100"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={() => openLightbox(activeImage)}
        >
          {imageUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={images[idx]?.caption || `${property.title} — photo ${idx + 1}`}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                idx === activeImage ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            />
          ))}

          {/* Prev / Next arrows (mobile) */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); previousImage(e); }}
                aria-label="Previous photo"
                className="
                  absolute left-3 top-1/2 -translate-y-1/2 z-10
                  w-8 h-8 bg-white rounded-full
                  flex items-center justify-center
                  shadow-[0_1px_6px_rgba(0,0,0,0.22)]
                  hover:scale-105 active:scale-95 transition-transform
                  focus:outline-none
                "
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5] -ml-px text-[#222222]" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(e); }}
                aria-label="Next photo"
                className="
                  absolute right-3 top-1/2 -translate-y-1/2 z-10
                  w-8 h-8 bg-white rounded-full
                  flex items-center justify-center
                  shadow-[0_1px_6px_rgba(0,0,0,0.22)]
                  hover:scale-105 active:scale-95 transition-transform
                  focus:outline-none
                "
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5] ml-px text-[#222222]" />
              </button>
            </>
          )}

          {/* Dot indicator */}
          {imageUrls.length > 1 && imageUrls.length <= 10 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {imageUrls.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setActiveImage(idx); }}
                  className={cn(
                    "rounded-full transition-all duration-200 focus:outline-none",
                    idx === activeImage
                      ? "w-2 h-2 bg-white"
                      : "w-1.5 h-1.5 bg-white/60"
                  )}
                />
              ))}
            </div>
          )}

          {/* Photo count badge (if more than 10, dots replaced by count) */}
          {imageUrls.length > 10 && (
            <div className="absolute bottom-3 right-3 z-10 bg-white/90 backdrop-blur-sm text-[#222222] text-[12px] font-semibold px-2.5 py-1 rounded-full">
              {activeImage + 1} / {imageUrls.length}
            </div>
          )}

          {/* Tour button (mobile) */}
          {hasTour && (
            <button
              onClick={(e) => { e.stopPropagation(); setTourOpen(true); }}
              className="
                absolute bottom-3 left-3 z-10
                flex items-center gap-1.5
                bg-white border border-[#222222] text-[#222222]
                text-[12px] font-semibold leading-none
                px-3 py-[7px] rounded-lg shadow-sm
              "
            >
              <Play className="w-3 h-3 fill-[#222222] stroke-0" />
              {effectiveTourType === "kuula" ? "360°" : "Video"}
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────
          TOUR VIEWER MODAL
      ───────────────────────────────────────── */}
      {tourOpen && (
        <TourViewer
          tourType={effectiveTourType as any}
          virtualTourUrl={property.virtualTourUrl ?? property.videoUrl}
          images={images.map((img) => ({ url: img.url, caption: img.caption }))}
          propertyId={property._id}
          onClose={() => setTourOpen(false)}
        />
      )}

      {/* ─────────────────────────────────────────
          AIRBNB LIGHTBOX
          White full-screen with:
          - Top bar: close + counter + share/save
          - Centred image viewer with nav arrows
          - Touch swipe support
          - Thumbnail strip bottom
      ───────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-white flex flex-col"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
        >
          {/* ── Top bar ── */}
          <div className="flex-none flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[#DDDDDD] bg-white">
            {/* Close */}
            <button
              onClick={closeLightbox}
              aria-label="Close"
              className="
                w-9 h-9 flex items-center justify-center rounded-full
                hover:bg-[#F7F7F7] active:bg-[#EBEBEB]
                transition-colors focus:outline-none -ml-1
              "
            >
              <X className="w-[18px] h-[18px] stroke-[2.5] text-[#222222]" />
            </button>

            {/* Counter */}
            <span className="text-[15px] font-semibold text-[#222222]">
              {activeImage + 1} / {imageUrls.length}
            </span>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <button
                aria-label="Share"
                className="
                  flex items-center gap-1.5 px-3 py-2 rounded-lg
                  text-[13px] font-semibold text-[#222222]
                  hover:bg-[#F7F7F7] active:bg-[#EBEBEB]
                  transition-colors focus:outline-none
                "
              >
                <Share className="w-4 h-4 stroke-[2]" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                aria-label="Save"
                className="
                  flex items-center gap-1.5 px-3 py-2 rounded-lg
                  text-[13px] font-semibold text-[#222222]
                  hover:bg-[#F7F7F7] active:bg-[#EBEBEB]
                  transition-colors focus:outline-none
                "
              >
                <Heart className="w-4 h-4 stroke-[2]" />
                <span className="hidden sm:inline">Save</span>
              </button>
            </div>
          </div>

          {/* ── Main viewer ── */}
          <div
            className="flex-1 relative flex items-center justify-center bg-[#F7F7F7] overflow-hidden px-4 md:px-20 py-6"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={closeLightbox}
          >
            {/* Prev */}
            {imageUrls.length > 1 && (
              <button
                onClick={previousImage}
                aria-label="Previous image"
                className="
                  absolute left-3 md:left-6 z-10
                  w-11 h-11 md:w-14 md:h-14
                  bg-white border border-[#DDDDDD] rounded-full
                  flex items-center justify-center
                  shadow-[0_2px_8px_rgba(0,0,0,0.14)]
                  hover:scale-105 active:scale-95 transition-transform
                  focus:outline-none
                "
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 stroke-[2] -ml-px text-[#222222]" />
              </button>
            )}

            {/* Image + caption */}
            <div
              className="relative flex flex-col items-center gap-3 max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Loading skeleton */}
              {!imgLoaded && (
                <div className="absolute inset-0 bg-neutral-200 animate-pulse rounded-lg" />
              )}
              <img
                key={imageUrls[activeImage]}
                src={imageUrls[activeImage]}
                alt={images[activeImage]?.caption || `Photo ${activeImage + 1}`}
                onLoad={() => setImgLoaded(true)}
                className={cn(
                  "max-w-full object-contain select-none rounded-sm transition-opacity duration-200",
                  "max-h-[calc(100svh-240px)] md:max-h-[calc(100svh-220px)]",
                  imgLoaded ? "opacity-100" : "opacity-0"
                )}
                draggable={false}
              />
              {images[activeImage]?.caption && imgLoaded && (
                <p className="text-[14px] text-[#717171] font-normal text-center max-w-[480px] px-4 leading-snug">
                  {images[activeImage].caption}
                </p>
              )}
            </div>

            {/* Next */}
            {imageUrls.length > 1 && (
              <button
                onClick={nextImage}
                aria-label="Next image"
                className="
                  absolute right-3 md:right-6 z-10
                  w-11 h-11 md:w-14 md:h-14
                  bg-white border border-[#DDDDDD] rounded-full
                  flex items-center justify-center
                  shadow-[0_2px_8px_rgba(0,0,0,0.14)]
                  hover:scale-105 active:scale-95 transition-transform
                  focus:outline-none
                "
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 stroke-[2] ml-px text-[#222222]" />
              </button>
            )}
          </div>

          {/* ── Thumbnail strip ── */}
          <div
            ref={thumbsRef}
            className="
              flex-none flex items-center gap-2
              px-4 md:px-6 py-3
              border-t border-[#DDDDDD] bg-white
              overflow-x-auto scroll-smooth
              [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            "
          >
            {imageUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => { setImgLoaded(false); setActiveImage(idx); }}
                aria-label={`Go to photo ${idx + 1}`}
                className={cn(
                  "flex-none w-[56px] h-[44px] md:w-[72px] md:h-[56px]",
                  "rounded-md overflow-hidden transition-all duration-150 focus:outline-none",
                  activeImage === idx
                    ? "ring-2 ring-offset-1 ring-[#222222] opacity-100"
                    : "opacity-50 hover:opacity-75"
                )}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyGallery;