"use client"

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  
  // Get images from property, prioritize main image first
  const images = property.images?.length > 0 
    ? [...property.images].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
    : [{ url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80", publicId: "fallback", caption: "Property" }];

  const imageUrls = images.map(img => img.url);

  const openLightbox = (index: number) => {
    setActiveImage(index);
    setLightboxOpen(true);
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

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 1));
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") previousImage();
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, nextImage, previousImage]);

  // Preload adjacent images
  useEffect(() => {
    if (!lightboxOpen) return;
    
    const preloadImage = (index: number) => {
      if (imageUrls[index] && !loading[index]) {
        const img = new Image();
        img.src = imageUrls[index];
      }
    };

    preloadImage((activeImage + 1) % imageUrls.length);
    preloadImage((activeImage - 1 + imageUrls.length) % imageUrls.length);
  }, [activeImage, lightboxOpen, imageUrls, loading]);

  const handleImageLoad = (index: number) => {
    setLoading(prev => ({ ...prev, [index]: false }));
  };

  const handleImageLoadStart = (index: number) => {
    setLoading(prev => ({ ...prev, [index]: true }));
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {/* Main large image */}
        <div 
          className="relative col-span-4 lg:col-span-2 lg:row-span-2 h-[400px] rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          <img 
            src={imageUrls[0]} 
            alt={images[0].caption || "Property main view"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
            <Maximize2 className="h-4 w-4" />
            View Gallery
          </div>
        </div>

        {/* Grid of smaller images */}
        {imageUrls.slice(1, 5).map((img, idx) => (
          <div 
            key={idx}
            className="relative col-span-2 lg:col-span-1 h-[196px] rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => openLightbox(idx + 1)}
          >
            <img 
              src={img} 
              alt={images[idx + 1]?.caption || `Property view ${idx + 2}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            {idx === 3 && imageUrls.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm group-hover:backdrop-blur-md transition-all duration-300">
                <span className="text-white font-semibold text-lg">+{imageUrls.length - 5} More</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Enhanced Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[98vw] w-full h-[95vh] p-0 bg-black/98 border-0">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Top Control Bar */}
            <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
              <div className="text-white">
                <h3 className="font-semibold text-lg">{property.title}</h3>
                {images[activeImage]?.caption && (
                  <p className="text-sm text-gray-300 mt-1">{images[activeImage].caption}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 backdrop-blur-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-9 w-9"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                  >
                    <ZoomOut className="h-5 w-5" />
                  </Button>
                  <span className="text-white text-sm px-2 min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-9 w-9"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="h-5 w-5" />
                  </Button>
                </div>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-9 w-9"
                  onClick={() => setLightboxOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Previous Button */}
            {imageUrls.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 text-white hover:bg-white/20 h-14 w-14 rounded-full backdrop-blur-sm bg-black/20"
                onClick={previousImage}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Image Container */}
            <div className="relative w-full h-full flex items-center justify-center p-20">
              <img 
                src={imageUrls[activeImage]} 
                alt={images[activeImage]?.caption || `Property view ${activeImage + 1}`}
                className="max-w-full max-h-full object-contain transition-transform duration-300"
                style={{ transform: `scale(${zoom})` }}
                onLoadStart={() => handleImageLoadStart(activeImage)}
                onLoad={() => handleImageLoad(activeImage)}
              />
              {loading[activeImage] && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Next Button */}
            {imageUrls.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 text-white hover:bg-white/20 h-14 w-14 rounded-full backdrop-blur-sm bg-black/20"
                onClick={nextImage}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Bottom Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Image Counter */}
              <div className="flex justify-center mb-4">
                <div className="bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                  {activeImage + 1} / {imageUrls.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="flex gap-2 justify-center overflow-x-auto pb-2 px-4 scrollbar-hide">
                {imageUrls.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveImage(idx); setZoom(1); }}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      idx === activeImage 
                        ? 'border-white scale-110 shadow-lg shadow-white/20' 
                        : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                    }`}
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
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="absolute bottom-4 left-4 text-white/60 text-xs backdrop-blur-sm bg-black/40 px-3 py-2 rounded-lg hidden lg:block">
              Use ← → arrow keys to navigate • +/- to zoom • ESC to close
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default PropertyGallery;