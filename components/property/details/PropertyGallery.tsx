"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Grid3x3, Play, Share2, Heart } from "lucide-react";
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
  const [saved, setSaved] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const pd = t.propertyDetails;

  const images = property.images?.length > 0
    ? [...property.images].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
    : [{ url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80", publicId: "fallback", caption: "Property" }];

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

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const nextImage = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    setImgLoaded(false);
    setActiveImage((prev) => (prev + 1) % imageUrls.length);
  }, [imageUrls.length]);

  const previousImage = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
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
    activeThumb?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [activeImage, lightboxOpen]);

  // Touch swipe
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (Math.abs(distance) >= minSwipeDistance) distance > 0 ? nextImage() : previousImage();
  };

  const gridImages = imageUrls.slice(0, 5);
  const remainingCount = imageUrls.length - 5;

  // ─── Grid layout config ───────────────────────────────────────────────────
  const gridConfig = (() => {
    const n = gridImages.length;
    if (n === 1) return { cols: "grid-cols-1", rows: "grid-rows-1", heroSpan: "" };
    if (n === 2) return { cols: "grid-cols-2", rows: "grid-rows-1", heroSpan: "" };
    if (n === 3) return { cols: "grid-cols-[2fr_1fr]", rows: "grid-rows-2", heroSpan: "row-span-2" };
    if (n === 4) return { cols: "grid-cols-[2fr_1fr]", rows: "grid-rows-2", heroSpan: "row-span-2" };
    return { cols: "grid-cols-[2fr_1fr_1fr]", rows: "grid-rows-2", heroSpan: "row-span-2" };
  })();

  return (
    <>
      {/* ═══════════════════════════════════════════
          DESKTOP GRID
      ═══════════════════════════════════════════ */}
      <div className="hidden md:block relative">
        <div className={cn("grid gap-2 rounded-2xl overflow-hidden h-[480px]", gridConfig.cols, gridConfig.rows)}>

          {/* Hero image */}
          <div
            className={cn("relative cursor-pointer overflow-hidden group bg-neutral-100", gridConfig.heroSpan)}
            onClick={() => openLightbox(0)}
          >
            <img
              src={imageUrls[0]}
              alt={images[0].caption || property.title}
              className="w-full h-full object-cover transition-[transform,filter] duration-300 ease-out group-hover:brightness-90"
            />
          </div>

          {/* Side images */}
          {gridImages.slice(1).map((url, idx) => {
            const globalIdx = idx + 1;
            const isLast = globalIdx === gridImages.length - 1 && remainingCount > 0;
            return (
              <div
                key={globalIdx}
                className="relative cursor-pointer overflow-hidden group bg-neutral-100"
                onClick={() => openLightbox(globalIdx)}
              >
                <img
                  src={url}
                  alt={images[globalIdx]?.caption || `${property.title} — photo ${globalIdx + 1}`}
                  className="w-full h-full object-cover transition-[transform,filter] duration-300 ease-out group-hover:brightness-90"
                />
                {isLast && (
                  <div className="absolute inset-0 bg-black/20 flex items-end justify-end p-3">
                    {/* handled by the button below */}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Bottom-right action buttons ── */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
          {hasTour && (
            <button
              onClick={() => setTourOpen(true)}
              className="flex items-center gap-1.5 bg-white border border-[#222222] text-[#222222] text-[13px] font-semibold px-[14px] py-[9px] rounded-lg hover:bg-[#F7F7F7] active:scale-[0.98] transition-all duration-150 shadow-sm"
            >
              <Play className="w-[13px] h-[13px] fill-[#222222] stroke-0 flex-shrink-0" />
              {effectiveTourType === "kuula" ? "360° tour" : "Video tour"}
            </button>
          )}
          <button
            onClick={() => openLightbox(0)}
            className="flex items-center gap-1.5 bg-white border border-[#222222] text-[#222222] text-[13px] font-semibold px-[14px] py-[9px] rounded-lg hover:bg-[#F7F7F7] active:scale-[0.98] transition-all duration-150 shadow-sm"
          >
            <Grid3x3 className="w-[13px] h-[13px] stroke-[2.4] flex-shrink-0" />
            {pd?.viewGallery || "Show all photos"}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          MOBILE — Airbnb-style swipeable strip
      ═══════════════════════════════════════════ */}
      <div className="md:hidden relative">
        <div
          className="relative h-[300px] sm:h-[360px] overflow-hidden rounded-xl bg-neutral-100"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={() => openLightbox(activeImage)}
        >
          {/* Images */}
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

          {/* Gradient overlay bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

          {/* Nav arrows */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); previousImage(e); }}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(0,0,0,0.28)] active:scale-95 transition-transform focus:outline-none"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5] -ml-px text-[#222222]" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(e); }}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(0,0,0,0.28)] active:scale-95 transition-transform focus:outline-none"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5] ml-px text-[#222222]" />
              </button>
            </>
          )}

          {/* Dot indicator (≤ 10 images) */}
          {imageUrls.length > 1 && imageUrls.length <= 10 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-[5px] z-10">
              {imageUrls.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setActiveImage(idx); }}
                  className={cn(
                    "rounded-full transition-all duration-200 focus:outline-none",
                    idx === activeImage ? "w-[7px] h-[7px] bg-white" : "w-[5px] h-[5px] bg-white/55"
                  )}
                />
              ))}
            </div>
          )}

          {/* Count badge (> 10 images) */}
          {imageUrls.length > 10 && (
            <div className="absolute bottom-3 right-3 z-10 bg-[#222222]/75 backdrop-blur-sm text-white text-[12px] font-semibold px-2.5 py-1 rounded-full">
              {activeImage + 1} / {imageUrls.length}
            </div>
          )}

          {/* Mobile share/save */}
          <div className="absolute top-3 right-3 flex gap-1.5 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
              aria-label="Share"
            >
              <Share2 className="w-3.5 h-3.5 stroke-[2.2] text-[#222222]" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setSaved(s => !s); }}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
              aria-label="Save"
            >
              <Heart className={cn("w-3.5 h-3.5 stroke-[2.2] transition-colors", saved ? "fill-[#FF385C] stroke-[#FF385C]" : "text-[#222222]")} />
            </button>
          </div>

          {/* Tour button */}
          {hasTour && (
            <button
              onClick={(e) => { e.stopPropagation(); setTourOpen(true); }}
              className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-white border border-[#222222] text-[#222222] text-[12px] font-semibold leading-none px-3 py-[7px] rounded-lg shadow-sm"
            >
              <Play className="w-3 h-3 fill-[#222222] stroke-0" />
              {effectiveTourType === "kuula" ? "360°" : "Video"}
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          TOUR VIEWER MODAL
      ═══════════════════════════════════════════ */}
      {tourOpen && (
        <TourViewer
          tourType={effectiveTourType as any}
          virtualTourUrl={property.virtualTourUrl ?? property.videoUrl}
          images={images.map((img) => ({ url: img.url, caption: img.caption }))}
          propertyId={property._id}
          onClose={() => setTourOpen(false)}
        />
      )}

      {/* ═══════════════════════════════════════════
          LIGHTBOX — Airbnb white full-screen
      ═══════════════════════════════════════════ */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-white flex flex-col"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Circular', 'Segoe UI', sans-serif" }}
        >
          {/* Top bar */}
          <div className="flex-none flex items-center justify-between px-5 md:px-8 h-[64px] border-b border-[#EBEBEB] bg-white">
            {/* Close */}
            <button
              onClick={closeLightbox}
              aria-label="Close gallery"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] active:bg-[#EBEBEB] transition-colors focus:outline-none -ml-2"
            >
              <X className="w-[18px] h-[18px] stroke-[2.5] text-[#222222]" />
            </button>

            {/* Counter */}
            <span className="text-[15px] font-semibold text-[#222222] tracking-tight">
              {activeImage + 1} / {imageUrls.length}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              <button
                aria-label="Share"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-[#222222] underline hover:bg-[#F7F7F7] active:bg-[#EBEBEB] transition-colors focus:outline-none"
              >
                <Share2 className="w-4 h-4 stroke-[2]" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={() => setSaved(s => !s)}
                aria-label="Save"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-[#222222] underline hover:bg-[#F7F7F7] active:bg-[#EBEBEB] transition-colors focus:outline-none"
              >
                <Heart className={cn("w-4 h-4 stroke-[2] transition-colors", saved ? "fill-[#FF385C] stroke-[#FF385C]" : "")} />
                <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
              </button>
            </div>
          </div>

          {/* Viewer */}
          <div
            className="flex-1 relative flex items-center justify-center bg-white overflow-hidden px-4 md:px-24 py-4"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Prev arrow */}
            {imageUrls.length > 1 && (
              <button
                onClick={previousImage}
                aria-label="Previous image"
                className="absolute left-4 md:left-8 z-10 w-10 h-10 md:w-12 md:h-12 bg-white border border-[#DDDDDD] rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:border-[#222222] hover:shadow-[0_2px_16px_rgba(0,0,0,0.2)] active:scale-95 transition-all duration-150 focus:outline-none"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2] -ml-0.5 text-[#222222]" />
              </button>
            )}

            {/* Image + caption */}
            <div
              className="relative flex flex-col items-center gap-4 max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {!imgLoaded && (
                <div className="absolute inset-0 bg-[#F7F7F7] animate-pulse rounded-xl" />
              )}
              <img
                key={imageUrls[activeImage]}
                src={imageUrls[activeImage]}
                alt={images[activeImage]?.caption || `Photo ${activeImage + 1}`}
                onLoad={() => setImgLoaded(true)}
                className={cn(
                  "max-w-full object-contain select-none rounded-xl transition-opacity duration-200",
                  "max-h-[calc(100svh-200px)] md:max-h-[calc(100svh-180px)]",
                  imgLoaded ? "opacity-100" : "opacity-0"
                )}
                draggable={false}
              />
              {images[activeImage]?.caption && imgLoaded && (
                <p className="text-[14px] text-[#717171] font-normal text-center max-w-[520px] px-4 leading-relaxed">
                  {images[activeImage].caption}
                </p>
              )}
            </div>

            {/* Next arrow */}
            {imageUrls.length > 1 && (
              <button
                onClick={nextImage}
                aria-label="Next image"
                className="absolute right-4 md:right-8 z-10 w-10 h-10 md:w-12 md:h-12 bg-white border border-[#DDDDDD] rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:border-[#222222] hover:shadow-[0_2px_16px_rgba(0,0,0,0.2)] active:scale-95 transition-all duration-150 focus:outline-none"
              >
                <ChevronRight className="w-5 h-5 stroke-2 ml-0.5 text-[#222222]" />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          <div
            ref={thumbsRef}
            className="flex-none flex items-center gap-2 px-5 md:px-8 py-3 border-t border-[#EBEBEB] bg-white overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {imageUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => { setImgLoaded(false); setActiveImage(idx); }}
                aria-label={`Go to photo ${idx + 1}`}
                className={cn(
                  "flex-none w-14 h-11 md:w-[76px] md:h-[58px] rounded-lg overflow-hidden transition-all duration-150 focus:outline-none",
                  activeImage === idx
                    ? "ring-2 ring-offset-1 ring-[#222222] opacity-100"
                    : "opacity-40 hover:opacity-70"
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