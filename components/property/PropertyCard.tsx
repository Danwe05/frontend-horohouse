"use client";

import { Heart, Bed, Bath, Ruler, Share2, Flag, ShieldCheck, Cpu } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useCallback } from "react";
import type { StaticImageData } from "next/image";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReportModal } from "./ReportModal";
import { formatTimeAgo, isNew, formatPrice } from "@/lib/propertyutils";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PropertyCardProps {
  id: string;
  image: string | StaticImageData;
  images?: (string | StaticImageData)[];
  price: string;
  timeAgo: string;
  address: string;
  beds?: number;
  baths?: number;
  sqft?: string;
  tag?: string;
  /** Optionally pass true/false to skip the favorites fetch entirely */
  initialIsFavorite?: boolean;
  listingType?: "rent" | "sale";
  /** Whether this card is in "comparison" mode */
  isCompared?: boolean;
  /** Called when the comparison checkbox changes */
  onCompareChange?: (id: string, checked: boolean) => void;
  /** Whether the comparison checkbox should be shown at all */
  showCompare?: boolean;
  /** Whether the listing has been manually verified by the platform */
  isVerified?: boolean;
  /** Whether the listing is blockchain-verified (on-chain record exists) */
  isBlockchainVerified?: boolean;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const PropertyCardSkeleton = () => (
  <Card className="overflow-hidden border-0 shadow-sm animate-pulse py-0">
    <div className="h-48 bg-muted w-full" />
    <CardContent className="pb-4 pt-3 space-y-3">
      <div className="h-5 bg-muted rounded w-2/3" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="flex gap-3">
        <div className="h-4 bg-muted rounded w-12" />
        <div className="h-4 bg-muted rounded w-12" />
        <div className="h-4 bg-muted rounded w-12" />
      </div>
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const PropertyCard = ({
  id,
  image,
  images,
  price,
  timeAgo,
  address,
  beds,
  baths,
  sqft,
  tag,
  initialIsFavorite,
  listingType = "sale",
  isCompared = false,
  onCompareChange,
  showCompare = false,
  isVerified = false,
  isBlockchainVerified = false,
}: PropertyCardProps) => {
  // ── Favorites from context ──────────────────────────────────────────────
  const { isFavorite, addFavorite, removeFavorite, isLoaded } = useFavorites();

  const favorited =
    initialIsFavorite !== undefined ? initialIsFavorite : isFavorite(id);

  const [localFavorite, setLocalFavorite] = useState(favorited);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Sync if context loads after mount
  useEffect(() => {
    if (isLoaded && initialIsFavorite === undefined) {
      setLocalFavorite(isFavorite(id));
    }
  }, [isLoaded, id, isFavorite, initialIsFavorite]);

  // ── Auth / language ─────────────────────────────────────────────────────
  const { isAuthenticated } = useAuth();
  const { translate, language } = useLanguage();

  // ── Auto-translation ────────────────────────────────────────────────────
  const [translatedAddress, setTranslatedAddress] = useState(address);
  const [translatedTag, setTranslatedTag] = useState(tag);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const [addr, t] = await Promise.all([
        translate(address),
        tag ? translate(tag) : Promise.resolve(tag),
      ]);
      if (!cancelled) {
        setTranslatedAddress(addr);
        setTranslatedTag(t || tag);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [language, address, tag, translate]);

  // ── Report modal ────────────────────────────────────────────────────────
  const [reportOpen, setReportOpen] = useState(false);

  // ── Carousel dot tracking ───────────────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState(0);

  // ── Image processing ────────────────────────────────────────────────────
  const getImageSrc = (img: string | StaticImageData): string | null => {
    if (typeof img === "string") return img.trim() || null;
    return img.src || null;
  };

  const imageArray = (images && images.length > 0 ? images : [image])
    .map(getImageSrc)
    .filter((src): src is string => src !== null && src.length > 0);

  const hasMultipleImages = imageArray.length > 1;

  // ── Derived flags ────────────────────────────────────────────────────────
  const showNewBadge = isNew(timeAgo) && !tag;
  const displayTag = showNewBadge ? "New" : translatedTag;
  const formattedTime = formatTimeAgo(timeAgo);
  const formattedPrice = formatPrice(price);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated) {
        toast.error("Login required", {
          description: "Please login to add properties to your favorites.",
        });
        return;
      }

      if (isTogglingFavorite) return;

      const prev = localFavorite;
      setLocalFavorite(!prev);
      setIsTogglingFavorite(true);

      try {
        if (prev) {
          await apiClient.removeFromFavorites(id);
          removeFavorite(id);
          toast.success("Removed from favorites");
        } else {
          await apiClient.addToFavorites(id);
          addFavorite(id);
          toast.success("Added to favorites");
        }
      } catch (error: any) {
        setLocalFavorite(prev);
        toast.error("Failed to update favorites", {
          description:
            error?.response?.data?.message || "Please try again later.",
        });
      } finally {
        setIsTogglingFavorite(false);
      }
    },
    [isAuthenticated, isTogglingFavorite, localFavorite, id, addFavorite, removeFavorite]
  );

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const url = `${window.location.origin}/properties/${id}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: address, url });
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard");
        }
      } catch {
        // User cancelled share or clipboard failed
      }
    },
    [id, address]
  );

  const handleReport = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReportOpen(true);
  }, []);

  const handleCompare = useCallback(
    (checked: boolean) => {
      onCompareChange?.(id, checked);
    },
    [id, onCompareChange]
  );

  // ── Guard ────────────────────────────────────────────────────────────────
  if (imageArray.length === 0) return null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Report modal lives outside the Link to avoid nested-anchor issues */}
      <ReportModal
        propertyId={id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />

      <div className="block relative group">
        {/* Comparison checkbox — rendered outside the Link */}
        {showCompare && (
          <div
            className="absolute top-3 left-3 z-20"
            onClick={(e) => e.preventDefault()}
          >
            <div className="w-6 h-6 bg-card rounded flex items-center justify-center shadow-md">
              <Checkbox
                checked={isCompared}
                onCheckedChange={handleCompare}
                aria-label="Compare this property"
              />
            </div>
          </div>
        )}

        <Link href={`/properties/${id}`} className="block">
          <Card
            className={cn(
              "overflow-hidden shadow-none border-1 transition-all duration-200 py-0",
              isCompared && "ring-2 ring-primary"
            )}
          >
            {/* ── Image carousel ── */}
            <div className="relative">
              <Carousel
                className="w-full"
                opts={{ loop: true }}
                // Track active index via the Embla API exposed by shadcn Carousel
                setApi={(api) => {
                  if (!api) return;
                  setActiveIndex(api.selectedScrollSnap());
                  api.on("select", () =>
                    setActiveIndex(api.selectedScrollSnap())
                  );
                }}
              >
                <CarouselContent className="ml-0">
                  {imageArray.map((imgSrc, index) => (
                    <CarouselItem key={index} className="pl-0">
                      <img
                        src={imgSrc}
                        alt={`${address} — photo ${index + 1}`}
                        loading="lazy"
                        className="w-full h-48 object-cover transition-transform duration-300"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>

                {hasMultipleImages && (
                  <div onClick={(e) => e.preventDefault()}>
                    <CarouselPrevious className="left-2 bg-black/40 text-white opacity-0 group-hover:opacity-100 backdrop-blur-sm border-0 hover:bg-black/60 transition-all duration-200" />
                    <CarouselNext className="right-2 bg-black/40 text-white opacity-0 group-hover:opacity-100 backdrop-blur-sm border-0 hover:bg-black/60 transition-all duration-200" />
                  </div>
                )}
              </Carousel>

              {/* Dot indicators — shift up when verification strip is present */}
              {hasMultipleImages && (
                <div
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 transition-all duration-200",
                    (isVerified || isBlockchainVerified) ? "bottom-8" : "bottom-2"
                  )}
                  onClick={(e) => e.preventDefault()}
                >
                  {imageArray.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "block rounded-full transition-all duration-200",
                        i === activeIndex
                          ? "w-2 h-2 bg-white"
                          : "w-1.5 h-1.5 bg-white/50"
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Verification strip — frosted bar anchored to bottom of image */}
              {(isVerified || isBlockchainVerified) && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md"
                  onClick={(e) => e.preventDefault()}
                >
                  {isVerified && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-white">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[11px] font-semibold tracking-wide text-emerald-300">
                            Verified
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        This listing has been verified by our team
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {isVerified && isBlockchainVerified && (
                    <span className="w-px h-3 bg-white/30 shrink-0" />
                  )}

                  {isBlockchainVerified && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-white">
                          <Cpu className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                          <span className="text-[11px] font-semibold tracking-wide text-violet-300">
                            Blockchain Verified
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Ownership record secured on-chain
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Push dots up when strip is visible */}
                  <div className="ml-auto" />
                </div>
              )}

              {/* Tag / New badge */}
              {displayTag && (
                <Badge
                  className={cn(
                    "absolute top-3 z-10",
                    showCompare ? "left-12" : "left-3",
                    showNewBadge
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-primary"
                  )}
                >
                  {displayTag}
                </Badge>
              )}

              {/* Action buttons — rendered inside a non-anchor div to avoid nested <a> */}
              <div
                className="absolute top-3 right-3 flex items-center gap-1.5 z-10"
                onClick={(e) => e.preventDefault()}
              >
                {/* Share */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleShare}
                      aria-label="Share this property"
                      className="w-8 h-8 bg-card rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                    >
                      <Share2 className="h-3.5 w-3.5 text-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Share</TooltipContent>
                </Tooltip>

                {/* Favorite */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleToggleFavorite}
                      disabled={isTogglingFavorite}
                      aria-label={
                        localFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      aria-pressed={localFavorite}
                      className="w-8 h-8 bg-card rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md disabled:opacity-50"
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 transition-colors",
                          localFavorite
                            ? "fill-destructive text-destructive"
                            : "text-foreground"
                        )}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {localFavorite ? "Unfavorite" : "Favorite"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* ── Card content ── */}
            <CardContent className="pb-4 pt-3">
              <div className="mb-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-foreground leading-tight">
                      {formattedPrice}
                    </span>
                    {listingType === "rent" && (
                      <span className="text-xs text-muted-foreground">/month</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formattedTime}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3 truncate">
                {translatedAddress}
              </p>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  {sqft && (
                    <div className="flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5" />
                      <span>{sqft}</span>
                    </div>
                  )}
                  {beds !== undefined && beds > 0 && (
                    <div className="flex items-center gap-1">
                      <Bed className="h-3.5 w-3.5" />
                      <span>{beds}</span>
                    </div>
                  )}
                  {baths !== undefined && baths > 0 && (
                    <div className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" />
                      <span>{baths}</span>
                    </div>
                  )}
                </div>

                {/* Report — plain button, not a Link (no nested anchor) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleReport}
                      aria-label="Report this listing"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      <span>Report</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Report this listing</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
};

export default PropertyCard;