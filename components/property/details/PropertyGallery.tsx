"use client"

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyGalleryProps {
  property: {
    images: Array<{ url: string; publicId: string; caption?: string; isMain?: boolean }>;
    title: string;
  };
}

const PropertyGallery = ({ property }: PropertyGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showThumbs, setShowThumbs] = useState(false);

  const images = property.images?.length > 0
    ? [...property.images].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
    : [{ url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80", publicId: "fallback", caption: "Property" }];

  const imageUrls = images.map(img => img.url);

  const openLightbox = (index: number) => {
    setActiveImage(index);
    setLightboxOpen(true);
    setZoom(1);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoom(1);
  };

  const nextImage = useCallback(() => {
    setActiveImage((prev) => (prev + 1) % imageUrls.length);
    setZoom(1);
  }, [imageUrls.length]);

  const previousImage = useCallback(() => {
    setActiveImage((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    setZoom(1);
  }, [imageUrls.length]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1));

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") previousImage();
      if (e.key === "Escape") closeLightbox();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
    };

    // Lock body scroll
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, nextImage, previousImage]);

  return (
    <>
      {/* Grid Preview */}
      <div className="grid grid-cols-4 gap-3 bg-white p-3 rounded-3xl shadow-sm border border-slate-100">
        <div
          className="relative col-span-4 lg:col-span-2 lg:row-span-2 h-[400px] rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          <img
            src={imageUrls[0]}
            alt={images[0].caption || "Property main view"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="eager"
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-slate-900/10 transition-colors duration-300" />
          <div className="absolute bottom-4 right-4 bg-white/90 text-slate-900 font-bold px-4 py-2 rounded-xl text-sm backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 shadow-sm transform translate-y-2 group-hover:translate-y-0">
            <Maximize2 className="h-4 w-4" />
            View Gallery
          </div>
        </div>

        {imageUrls.slice(1, 5).map((img, idx) => (
          <div
            key={idx}
            className="relative col-span-2 lg:col-span-1 h-[196px] rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => openLightbox(idx + 1)}
          >
            <img
              src={img}
              alt={images[idx + 1]?.caption || `Property view ${idx + 2}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-slate-900/10 transition-colors duration-300" />
            {idx === 3 && imageUrls.length > 5 && (
              <div
                className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center backdrop-blur-[2px] group-hover:backdrop-blur-md transition-all duration-300 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); openLightbox(4); }}
              >
                <Grid className="text-white h-8 w-8 mb-2 opacity-80" />
                <span className="text-white font-bold text-xl tracking-tight">+{imageUrls.length - 5} More</span>
                <span className="text-white/70 text-xs mt-1">Click to view all</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Full-Screen Lightbox — rendered in a portal-like fixed overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex flex-col"
          style={{ width: "100vw", height: "100vh", top: 0, left: 0 }}
        >
          {/* Top Bar */}
          <div className="flex-none flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/90 to-transparent absolute top-0 left-0 right-0 z-10">
            <div className="text-white">
              <h3 className="font-bold text-lg leading-tight drop-shadow">{property.title}</h3>
              {images[activeImage]?.caption && (
                <p className="text-sm text-white/70 mt-0.5">{images[activeImage].caption}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl p-1 backdrop-blur border border-white/10">
                <button
                  className="text-white hover:bg-white/20 h-9 w-9 rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-white text-xs font-mono px-2 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  className="text-white hover:bg-white/20 h-9 w-9 rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              {/* Toggle thumbnails */}
              <button
                className="text-white bg-white/10 hover:bg-white/20 h-10 w-10 rounded-xl backdrop-blur border border-white/10 flex items-center justify-center transition-colors"
                onClick={() => setShowThumbs(p => !p)}
                title="Toggle thumbnails"
              >
                <Grid className="h-4 w-4" />
              </button>

              {/* Close */}
              <button
                className="text-white bg-white/10 hover:bg-white/20 h-10 w-10 rounded-xl backdrop-blur border border-white/10 flex items-center justify-center transition-colors ml-1"
                onClick={closeLightbox}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main image area */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {/* Prev */}
            {imageUrls.length > 1 && (
              <button
                className="absolute left-3 sm:left-6 z-10 bg-black/40 hover:bg-black/70 text-white h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 transition-colors"
                onClick={previousImage}
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            )}

            <img
              src={imageUrls[activeImage]}
              alt={images[activeImage]?.caption || `Property view ${activeImage + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-300 select-none"
              style={{
                transform: `scale(${zoom})`,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: "60px 80px",
              }}
              draggable={false}
            />

            {/* Next */}
            {imageUrls.length > 1 && (
              <button
                className="absolute right-3 sm:right-6 z-10 bg-black/40 hover:bg-black/70 text-white h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 transition-colors"
                onClick={nextImage}
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            )}
          </div>

          {/* Bottom bar: counter + thumbnails */}
          <div className="flex-none bg-gradient-to-t from-black/90 to-transparent pb-4 pt-6">
            {/* Counter */}
            <div className="flex justify-center mb-3">
              <span className="bg-white/10 text-white text-sm font-semibold px-4 py-1.5 rounded-full backdrop-blur border border-white/10">
                {activeImage + 1} / {imageUrls.length}
              </span>
            </div>

            {/* Thumbnail strip */}
            {showThumbs && (
              <div className="flex gap-2 justify-start sm:justify-center overflow-x-auto px-6 pb-1 scrollbar-hide">
                {imageUrls.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveImage(idx); setZoom(1); }}
                    className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      idx === activeImage
                        ? "border-white w-20 h-14 sm:w-24 sm:h-16 shadow-lg shadow-white/20 scale-105"
                        : "border-white/20 opacity-50 hover:opacity-90 hover:border-white/50 w-16 h-12 sm:w-20 sm:h-14"
                    }`}
                    style={{ minWidth: idx === activeImage ? undefined : undefined }}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Keyboard hint */}
            <p className="text-center text-white/30 text-xs mt-3 hidden lg:block">
              ← → navigate &nbsp;·&nbsp; +/− zoom &nbsp;·&nbsp; ESC close
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

export default PropertyGallery;